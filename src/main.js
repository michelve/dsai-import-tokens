// Main plugin entry point

import { importTokens } from './import.js';
import { exportTokens } from './export.js';
import { startServer, stopServer, getServerStatus, sendThemeToServer, sendCollectionToServer } from './server.js';

// Show UI
figma.showUI(__html__, { width: 400, height: 450 });

// Load and send settings to UI on startup
async function initializeSettings() {
  try {
    const exportFormat = await figma.clientStorage.getAsync('exportFormat');
    const serverEnabled = await figma.clientStorage.getAsync('serverEnabled');
    const serverPort = await figma.clientStorage.getAsync('serverPort');
    
    // Load MCP settings
    const mcpEnabled = await figma.clientStorage.getAsync('mcpEnabled');
    const mcpPort = await figma.clientStorage.getAsync('mcpPort');
    const mcpChannel = await figma.clientStorage.getAsync('mcpChannel');
    
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: {
        exportFormat: exportFormat || 'single',
        serverEnabled: serverEnabled || false,
        serverPort: serverPort || 8947,
        mcpEnabled: mcpEnabled || false,
        mcpPort: mcpPort || 3055,
        mcpChannel: mcpChannel || 'dsai'
      }
    });
    
    // Auto-start server if it was enabled
    if (serverEnabled) {
      const result = await startServer(serverPort || 8947);
      if (result.success) {
        figma.ui.postMessage({
          type: 'server-started',
          port: result.port
        });
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    // Send default settings
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: {
        exportFormat: 'single',
        serverEnabled: false,
        serverPort: 8947,
        mcpEnabled: false,
        mcpPort: 3055,
        mcpChannel: 'dsai'
      }
    });
  }
}

// Initialize settings when UI loads
initializeSettings();

// Message handler
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'import-tokens') {
      await importTokens(msg.data);
    } else if (msg.type === 'export-tokens') {
      await exportTokens(msg.settings || {});
    } else if (msg.type === 'get-settings') {
      // Request for current settings
      const exportFormat = await figma.clientStorage.getAsync('exportFormat');
      const serverEnabled = await figma.clientStorage.getAsync('serverEnabled');
      const serverPort = await figma.clientStorage.getAsync('serverPort');
      
      figma.ui.postMessage({
        type: 'settings-loaded',
        settings: {
          exportFormat: exportFormat || 'single',
          serverEnabled: serverEnabled || false,
          serverPort: serverPort || 8947
        }
      });
    } else if (msg.type === 'save-settings') {
      // Save settings to client storage
      if (msg.settings) {
        for (const [key, value] of Object.entries(msg.settings)) {
          await figma.clientStorage.setAsync(key, value);
        }
        figma.ui.postMessage({
          type: 'settings-saved'
        });
      }
    } else if (msg.type === 'start-server') {
      // Start the HTTP server
      const result = await startServer(msg.port);
      if (result.success) {
        await figma.clientStorage.setAsync('serverEnabled', true);
        await figma.clientStorage.setAsync('serverPort', result.port);
        figma.ui.postMessage({
          type: 'server-started',
          port: result.port
        });
      } else {
        figma.ui.postMessage({
          type: 'server-error',
          message: result.message
        });
      }
    } else if (msg.type === 'stop-server') {
      // Stop the HTTP server
      const result = await stopServer();
      if (result.success) {
        await figma.clientStorage.setAsync('serverEnabled', false);
        figma.ui.postMessage({
          type: 'server-stopped'
        });
      } else {
        figma.ui.postMessage({
          type: 'server-error',
          message: result.message
        });
      }
    } else if (msg.type === 'restart-server') {
      // Restart server with new port
      await stopServer();
      const result = await startServer(msg.port);
      if (result.success) {
        await figma.clientStorage.setAsync('serverPort', result.port);
        figma.ui.postMessage({
          type: 'server-started',
          port: result.port
        });
      } else {
        await figma.clientStorage.setAsync('serverEnabled', false);
        figma.ui.postMessage({
          type: 'server-error',
          message: result.message
        });
      }
    } else if (msg.type === 'get-server-status') {
      // Get current server status
      const status = getServerStatus();
      figma.ui.postMessage({
        type: 'server-status',
        enabled: status.enabled,
        port: status.port
      });
    } else if (msg.type === 'send-theme') {
      // Send complete theme to local server
      const result = await sendThemeToServer();
      if (result.success) {
        figma.ui.postMessage({
          type: 'send-success',
          message: result.message
        });
      } else {
        figma.ui.postMessage({
          type: 'send-error',
          message: result.message
        });
      }
    } else if (msg.type === 'send-collection') {
      // Send specific collection to local server
      const result = await sendCollectionToServer(msg.collectionName);
      if (result.success) {
        figma.ui.postMessage({
          type: 'send-success',
          message: result.message
        });
      } else {
        figma.ui.postMessage({
          type: 'send-error',
          message: result.message
        });
      }
    } else if (msg.type === 'save-mcp-settings') {
      // Save MCP settings from UI
      await figma.clientStorage.setAsync('mcpEnabled', msg.enabled);
      await figma.clientStorage.setAsync('mcpPort', msg.port);
      await figma.clientStorage.setAsync('mcpChannel', msg.channel);
    } else if (msg.type === 'mcp-command') {
      // Handle MCP command from UI WebSocket
      const result = await handleMCPCommand(msg.command);
      figma.ui.postMessage({
        type: 'mcp-response',
        data: result
      });
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: msg.type === 'import-tokens' ? 'import-error' : 'export-error',
      message: `Operation failed: ${error.message}`,
    });
  }
};

// Handle MCP commands
async function handleMCPCommand(command) {
  try {
    const { id, command: cmdName, params } = command;
    let result;
    
    switch (cmdName) {
      case 'get_collections':
        result = await getCollections();
        break;
      case 'get_collection':
        result = await getCollection(params.name);
        break;
      case 'export_theme':
        result = await exportTheme(params.format);
        break;
      case 'get_variable':
        result = await getVariable(params.name, params.collection);
        break;
      default:
        result = { error: `Unknown command: ${cmdName}` };
    }
    
    return {
      id,
      success: !result.error,
      data: result
    };
  } catch (error) {
    return {
      id: command.id,
      success: false,
      error: error.message
    };
  }
}

// MCP command handlers
async function getCollections() {
  const collections = figma.variables.getLocalVariableCollections();
  return collections.map(col => ({
    id: col.id,
    name: col.name,
    modes: col.modes.map(m => ({ modeId: m.modeId, name: m.name })),
    variableCount: col.variableIds.length
  }));
}

async function getCollection(name) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find(c => c.name === name);
  
  if (!collection) {
    return { error: `Collection "${name}" not found` };
  }
  
  // Get all variables once for reference resolution
  const allVariables = await getAllVariablesForExport();
  
  // Use the same export format as export.js
  return await processCollectionForExport(collection, allVariables);
}

async function exportTheme(format) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const theme = {};
  
  // Get all variables once for reference resolution
  const allVariables = await getAllVariablesForExport();
  
  for (const collection of collections) {
    theme[collection.name] = await processCollectionForExport(collection, allVariables);
  }
  
  return theme;
}

async function getVariable(name, collectionName) {
  const collections = figma.variables.getLocalVariableCollections();
  
  for (const collection of collections) {
    if (collectionName && collection.name !== collectionName) continue;
    
    const variable = collection.variableIds
      .map(id => figma.variables.getVariableById(id))
      .find(v => v && v.name === name);
    
    if (variable) {
      const values = {};
      for (const mode of collection.modes) {
        const value = variable.valuesByMode[mode.modeId];
        values[mode.name] = resolveValue(value, variable.resolvedType);
      }
      
      return {
        id: variable.id,
        name: variable.name,
        type: variable.resolvedType,
        collection: collection.name,
        values
      };
    }
  }
  
  return { error: `Variable "${name}" not found` };
}

function resolveValue(value, type) {
  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const aliasedVar = figma.variables.getVariableById(value.id);
    return aliasedVar ? `{${aliasedVar.name}}` : value;
  }
  
  if (type === 'COLOR' && typeof value === 'object') {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    const a = value.a !== undefined ? value.a : 1;
    
    if (a === 1) {
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  
  return value;
}

// Helper functions for export (reusing export.js logic)
async function getAllVariablesForExport() {
  const allVariables = [];
  const types = ['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'];
  
  for (const type of types) {
    const variables = await figma.variables.getLocalVariablesAsync(type);
    allVariables.push(...variables);
  }
  
  return allVariables;
}

async function processCollectionForExport(collection, allVariables) {
  const collectionData = {
    modes: {}
  };

  // Get all variables in this collection
  const variables = allVariables.filter(v => v.variableCollectionId === collection.id);

  // Process each mode
  for (const mode of collection.modes) {
    const modeData = {};

    // Group variables by their path structure
    for (const variable of variables) {
      const tokenPath = variable.name.split('/');
      const value = variable.valuesByMode[mode.modeId];

      if (value === undefined) continue;

      // Build nested structure based on path
      let current = modeData;
      for (let i = 0; i < tokenPath.length - 1; i++) {
        if (!current[tokenPath[i]]) {
          current[tokenPath[i]] = {};
        }
        current = current[tokenPath[i]];
      }

      // Create token object
      const tokenName = tokenPath[tokenPath.length - 1];
      const token = variableToTokenForExport(variable, value, allVariables);
      current[tokenName] = token;
    }

    collectionData.modes[mode.name] = modeData;
  }

  return collectionData;
}

function variableToTokenForExport(variable, value, allVariables) {
  const token = {
    $value: null,
    $type: getTokenTypeForExport(variable.resolvedType),
  };

  // Add description if available
  if (variable.description) {
    token.$description = variable.description;
  }

  // Handle alias vs direct value
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    // This is an alias reference
    const aliasPath = resolveAliasPathForExport(value.id, allVariables);
    if (aliasPath) {
      token.$value = aliasPath;
    } else {
      console.warn(`Could not resolve alias for variable: ${variable.name}, id: ${value.id}`);
      token.$value = `{UNRESOLVED_ALIAS_${value.id}}`;
    }
  } else if (value !== undefined && value !== null) {
    // Direct value
    token.$value = formatValueForExport(value, variable.resolvedType);
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

function getTokenTypeForExport(figmaType) {
  const typeMap = {
    COLOR: 'color',
    FLOAT: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
  };
  return typeMap[figmaType] || 'string';
}

function formatValueForExport(value, type) {
  // Safety check for alias objects
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    console.error('ERROR: Alias object passed to formatValueForExport!', value);
    return `{ERROR_ALIAS_${value.id}}`;
  }

  switch (type) {
    case 'COLOR':
      if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);
        const a = value.a !== undefined ? value.a : 1;
        
        if (a === 1) {
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } else {
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
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

function resolveAliasPathForExport(aliasId, allVariables) {
  const aliasedVariable = allVariables.find(v => v.id === aliasId);
  if (!aliasedVariable) {
    return null;
  }
  return `{${aliasedVariable.name}}`;
}

