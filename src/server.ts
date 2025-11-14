/**
 * DSAI Import Tokens Plugin - Server Module
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Server module for remote connection functionality
// Sends design tokens to a local server running on the user's machine

import { colorToHex, resolveAliasPath } from './utils';

// Server state
const serverState = {
  enabled: false,
  port: 8947, // Default port for local server
  serverUrl: 'http://localhost:8947'
};

/**
 * Test connection to local server
 */
export async function testConnection(port: number): Promise<{success: boolean; message: string; serverInfo?: any}> {
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
  } catch {
    return {
      success: false,
      message: 'Cannot connect to local server. Make sure local-server.js is running.'
    };
  }
}

/**
 * Enable connection to local server
 */
export async function startServer(port: any): Promise<any> {
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
      message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Disable connection to local server
 */
export async function stopServer(): Promise<{success: boolean; message: string}> {
  serverState.enabled = false;
  return { 
    success: true, 
    message: 'Disconnected from local server' 
  };
}

/**
 * Get current server status
 */
export function getServerStatus(): {enabled: boolean; port: number; serverUrl: string} {
  return {
    enabled: serverState.enabled,
    port: serverState.port,
    serverUrl: serverState.serverUrl
  };
}

/**
 * Send complete theme to local server
 */
export async function sendThemeToServer(): Promise<any> {
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
    const themeData: any = {};

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
      message: `Failed to send: ${error instanceof Error ? error.message : String(error)}. Is local-server.js running?`
    };
  }
}

/**
 * Send specific collection to local server
 */
export async function sendCollectionToServer(collectionName: string): Promise<any> {
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
      message: `Failed to send: ${error instanceof Error ? error.message : String(error)}. Is local-server.js running?`
    };
  }
}

/**
 * Process a collection into token format
 */
async function processCollectionForExport(collection: any, allVariables: any): Promise<any> {
  const modes: any = {};

  for (const mode of collection.modes) {
    const tokens: any = {};

    for (const varId of collection.variableIds) {
      const variable = allVariables.find((v: any) => v.id === varId);
      if (!variable) continue;

      const value = variable.valuesByMode[mode.modeId];
      if (value === undefined) continue;

      // Build nested token structure
      const pathParts = variable.name.split('/');
      let current: any = tokens;
      
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
 * Parse description metadata into structured format
 */
function parseDescriptionMetadata(description: string): any {
  const result: any = {
    description: '',
    codeSyntax: {},
    extensions: {}
  };

  // Split by bullet points (•) - this is how metadata is stored
  const parts = description.split('•').map(s => s.trim()).filter(s => s);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Check if this part contains metadata (has colon)
    if (part.includes(':')) {
      // Split by line breaks to handle multiple metadata items
      const metadataItems = part.split('\n').map(s => s.trim()).filter(s => s);

      for (let j = 0; j < metadataItems.length; j++) {
        const item = metadataItems[j].trim();
        const colonIndex = item.indexOf(':');
        if (colonIndex === -1) continue;

        const key = item.substring(0, colonIndex).trim();
        const value = item.substring(colonIndex + 1).trim();

        // Map metadata keys to token structure
        switch(key) {
          case 'Docs.Reference':
            if (!result.extensions.docs) result.extensions.docs = {};
            result.extensions.docs.reference = value;
            break;
          case 'Docs.Section':
            if (!result.extensions.docs) result.extensions.docs = {};
            result.extensions.docs.section = value;
            break;
          case 'Docs.Subsection':
            if (!result.extensions.docs) result.extensions.docs = {};
            result.extensions.docs.subsection = value;
            break;
          case 'Platform.CssVariableName':
          case 'Platform.CssVariable':
            result.codeSyntax.WEB = value;
            break;
          case 'Platform.ScssVariableName':
            if (!result.extensions.platform) result.extensions.platform = {};
            result.extensions.platform.scssVariableName = value;
            break;
          case 'Platform.CssClass':
            if (!result.extensions.platform) result.extensions.platform = {};
            result.extensions.platform.cssClass = value;
            break;
          case 'Platform.RemValue':
            if (!result.extensions.platform) result.extensions.platform = {};
            result.extensions.platform.remValue = value;
            break;
          case 'Platform.BootstrapVersion':
            if (!result.extensions.platform) result.extensions.platform = {};
            result.extensions.platform.bootstrapVersion = value;
            break;
          case 'Platform.Viewport':
            if (!result.extensions.platform) result.extensions.platform = {};
            result.extensions.platform.viewport = value;
            break;
          default:
            // Handle unknown Platform.* metadata dynamically
            if (key.startsWith('Platform.')) {
              const platformKey = key.substring(9); // Remove "Platform." prefix
              const camelCaseKey = platformKey.charAt(0).toLowerCase() + platformKey.slice(1);
              if (!result.extensions.platform) result.extensions.platform = {};
              result.extensions.platform[camelCaseKey] = value;
            }
            // Otherwise, it's part of the description
            else if (j === 0 && i === 0) {
              result.description = item;
            }
            break;
        }
      }
    } else {
      // This is description text (no metadata keys)
      if (i === 0 && !result.description) {
        result.description = part;
      }
    }
  }

  return result;
}

/**
 * Convert variable to token format with $ prefixes
 */
function variableToToken(variable: any, value: any, allVariables: any): any {
  const token: any = {
    $value: null as any,
    $type: getTokenType(variable.resolvedType),
  };

  // Parse description to extract metadata and clean description
  if (variable.description) {
    const parsed = parseDescriptionMetadata(variable.description);

    // Only set description if we have a clean one
    if (parsed.description && parsed.description.length > 0) {
      token.$description = parsed.description;
    }

    // Add code syntax if found in description
    if (parsed.codeSyntax && Object.keys(parsed.codeSyntax).length > 0) {
      token.$codeSyntax = parsed.codeSyntax;
    }

    // Add extensions if found in description
    if (parsed.extensions && Object.keys(parsed.extensions).length > 0) {
      token.$extensions = parsed.extensions;
    }
  }

  // Also check Figma's built-in codeSyntax property and merge
  // Figma stores codeSyntax per platform (WEB, ANDROID, iOS)
  const figmaCodeSyntax = (variable as any).codeSyntax;
  if (figmaCodeSyntax && typeof figmaCodeSyntax === 'object') {
    if (!token.$codeSyntax) {
      token.$codeSyntax = {};
    }
    // Merge Figma's codeSyntax with parsed codeSyntax (parsed description takes precedence for WEB)
    if (figmaCodeSyntax.WEB && !token.$codeSyntax.WEB) {
      token.$codeSyntax.WEB = figmaCodeSyntax.WEB;
    }
    if (figmaCodeSyntax.ANDROID) {
      token.$codeSyntax.ANDROID = figmaCodeSyntax.ANDROID;
    }
    if (figmaCodeSyntax.iOS) {
      token.$codeSyntax.iOS = figmaCodeSyntax.iOS;
    }
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

  return token;
}

/**
 * Format value based on type
 */
function formatValue(value: any, type: any): any {
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
async function getAllVariablesForExport(): Promise<any[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables: any[] = [];

  for (const collection of collections) {
    for (const varId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (variable && !allVariables.find((v: any) => v.id === variable.id)) {
        allVariables.push(variable);
      }
    }
  }

  return allVariables;
}

/**
 * Map Figma variable type to token type
 */
function getTokenType(resolvedType: any): string {
  const typeMap: any = {
    'COLOR': 'color',
    'FLOAT': 'number',
    'STRING': 'string',
    'BOOLEAN': 'boolean'
  };
  return typeMap[resolvedType] || 'string';
}
