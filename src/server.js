// Server module for remote connection functionality
// Sends design tokens to a local server running on the user's machine

import { colorToHex, resolveAliasPath } from './utils.js';

// Server state
const serverState = {
  enabled: false,
  port: 8947, // Default port for local server
  serverUrl: 'http://localhost:8947'
};

/**
 * Test connection to local server
 */
export async function testConnection(port) {
  try {
    const url = `http://localhost:${port}/status`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Connected to local server',
        serverInfo: data
      };
    } else {
      return {
        success: false,
        message: `Server responded with status ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Cannot connect to local server. Make sure local-server.js is running.'
    };
  }
}

/**
 * Enable connection to local server
 */
export async function startServer(port) {
  try {
    // Validate port range
    const portNum = parseInt(port);
    if (Number.isNaN(portNum) || portNum < 8000 || portNum > 9999) {
      return { 
        success: false, 
        message: 'Port must be between 8000 and 9999' 
      };
    }

    serverState.port = portNum;
    serverState.serverUrl = `http://localhost:${portNum}`;
    
    // Test connection
    const testResult = await testConnection(portNum);
    
    if (testResult.success) {
      serverState.enabled = true;
      return { 
        success: true, 
        message: `Connected to local server on port ${portNum}`,
        port: portNum
      };
    } else {
      return {
        success: false,
        message: testResult.message
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to connect: ${error.message}` 
    };
  }
}

/**
 * Disable connection to local server
 */
export async function stopServer() {
  serverState.enabled = false;
  return { 
    success: true, 
    message: 'Disconnected from local server' 
  };
}

/**
 * Get current server status
 */
export function getServerStatus() {
  return {
    enabled: serverState.enabled,
    port: serverState.port
  };
}

/**
 * Send complete theme to local server
 */
export async function sendThemeToServer() {
  if (!serverState.enabled) {
    return {
      success: false,
      message: 'Local server connection not enabled'
    };
  }

  try {
    // Get all collections and build theme data
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    if (collections.length === 0) {
      return {
        success: false,
        message: 'No collections found to send'
      };
    }

    const allVariables = await getAllVariablesForExport();
    const themeData = {};

    for (const collection of collections) {
      const collectionData = await processCollectionForExport(collection, allVariables);
      themeData[collection.name] = collectionData;
    }

    // Send to local server
    const response = await fetch(`${serverState.serverUrl}/send-theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(themeData)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: `Theme sent successfully! Saved as ${result.filename}`,
        filename: result.filename,
        path: result.path
      };
    } else {
      return {
        success: false,
        message: `Server error: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to send: ${error.message}. Is local-server.js running?`
    };
  }
}

/**
 * Send specific collection to local server
 */
export async function sendCollectionToServer(collectionName) {
  if (!serverState.enabled) {
    return {
      success: false,
      message: 'Local server connection not enabled'
    };
  }

  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collection = collections.find(c => c.name === collectionName);

    if (!collection) {
      return {
        success: false,
        message: `Collection "${collectionName}" not found`
      };
    }

    // Get all variables for reference resolution
    const allVariables = [];
    for (const varId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (variable) {
        allVariables.push(variable);
      }
    }

    const collectionData = await processCollectionForExport(collection, allVariables);

    // Send to local server
    const response = await fetch(`${serverState.serverUrl}/send-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collectionName: collectionName,
        tokens: collectionData
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: `Collection "${collectionName}" sent successfully!`,
        filename: result.filename,
        path: result.path
      };
    } else {
      return {
        success: false,
        message: `Server error: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to send: ${error.message}. Is local-server.js running?`
    };
  }
}

/**
 * Process a collection into token format
 */
async function processCollectionForExport(collection, allVariables) {
  const modes = {};

  for (const mode of collection.modes) {
    const tokens = {};

    for (const varId of collection.variableIds) {
      const variable = allVariables.find(v => v.id === varId);
      if (!variable) continue;

      const value = variable.valuesByMode[mode.modeId];
      if (value === undefined) continue;

      // Build nested token structure
      const pathParts = variable.name.split('/');
      let current = tokens;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      const tokenName = pathParts[pathParts.length - 1];
      current[tokenName] = variableToToken(variable, value, allVariables);
    }

    modes[mode.name] = tokens;
  }

  return modes;
}

/**
 * Convert variable to token format with $ prefixes
 */
function variableToToken(variable, value, allVariables) {
  const token = {
    $value: null,
    $type: getTokenType(variable.resolvedType),
  };

  // Add description if available
  if (variable.description) {
    token.$description = variable.description;
  }

  // Handle alias vs direct value
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    // This is an alias reference
    const aliasPath = resolveAliasPath(value.id, allVariables);
    if (aliasPath) {
      token.$value = aliasPath;
    } else {
      console.warn(`Could not resolve alias for variable: ${variable.name}, id: ${value.id}`);
      token.$value = `{UNRESOLVED_ALIAS_${value.id}}`;
    }
  } else if (value !== undefined && value !== null) {
    // Direct value
    token.$value = formatValue(value, variable.resolvedType);
  } else {
    console.warn(`No value found for variable: ${variable.name}`);
    token.$value = null;
  }

  // Add scopes if not default
  if (variable.scopes && variable.scopes.length > 0 && !variable.scopes.includes('ALL_SCOPES')) {
    token.$scopes = variable.scopes;
  }

  // Add code syntax if available
  const codeSyntax = {};
  const webSyntax = variable.codeSyntax && variable.codeSyntax.WEB;
  const androidSyntax = variable.codeSyntax && variable.codeSyntax.ANDROID;
  const iosSyntax = variable.codeSyntax && variable.codeSyntax.iOS;

  if (webSyntax) codeSyntax.WEB = webSyntax;
  if (androidSyntax) codeSyntax.ANDROID = androidSyntax;
  if (iosSyntax) codeSyntax.iOS = iosSyntax;

  if (Object.keys(codeSyntax).length > 0) {
    token.$codeSyntax = codeSyntax;
  }

  return token;
}

/**
 * Format value based on type
 */
function formatValue(value, type) {
  // Safety check for alias objects
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    console.error('ERROR: Alias object passed to formatValue!', value);
    return `{ERROR_ALIAS_${value.id}}`;
  }

  switch (type) {
    case 'COLOR':
      if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
        return colorToHex(value);
      }
      console.error('ERROR: Invalid color value', value);
      return '#000000';
    case 'FLOAT':
      return value;
    case 'BOOLEAN':
      return value;
    case 'STRING':
      return value;
    default:
      return value;
  }
}

/**
 * Get all variables helper
 */
async function getAllVariablesForExport() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = [];

  for (const collection of collections) {
    for (const varId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (variable && !allVariables.find(v => v.id === variable.id)) {
        allVariables.push(variable);
      }
    }
  }

  return allVariables;
}

/**
 * Map Figma variable type to token type
 */
function getTokenType(resolvedType) {
  const typeMap = {
    'COLOR': 'color',
    'FLOAT': 'number',
    'STRING': 'string',
    'BOOLEAN': 'boolean'
  };
  return typeMap[resolvedType] || 'string';
}
