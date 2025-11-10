/**
 * DSAI Import Tokens Plugin
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For use with DSAI design system only.
 */

// Main plugin entry point

import { importTokens } from './import.js';
import { exportTokens } from './export.js';
import { startServer, stopServer, getServerStatus, sendThemeToServer, sendCollectionToServer } from './server.js';
import { colorToHex, resolveAliasPath } from './utils.js';

// Load preview for display in UI (similar to export but sends to textarea instead of download)
async function loadPreview(settings = {}) {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    if (collections.length === 0) {
      figma.ui.postMessage({
        type: 'preview-error',
        error: 'No variable collections found to preview.'
      });
      return;
    }

    const exportFormat = settings.exportFormat || 'single';

    // Get all variables once for reference resolution
    const allVariables = await figma.variables.getLocalVariablesAsync();

    if (exportFormat === 'separate') {
      // Preview each collection as separate section
      const files = [];
      
      for (const collection of collections) {
        const collectionData = await processCollectionForPreview(collection, allVariables);
        
        const fileName = collection.name.toLowerCase().replace(/\s+/g, '-') + '.json';
        files.push({
          fileName: fileName,
          body: { [collection.name]: collectionData }
        });
      }

      // Send multiple files to UI for preview
      figma.ui.postMessage({
        type: 'preview-result',
        files: files
      });

    } else {
      // Preview all collections in single view
      const tokenData = {};

      for (const collection of collections) {
        tokenData[collection.name] = await processCollectionForPreview(collection, allVariables);
      }

      // Send single data to UI for preview
      figma.ui.postMessage({
        type: 'preview-result',
        data: tokenData
      });
    }

  } catch (error) {
    console.error('Preview error:', error);
    figma.ui.postMessage({
      type: 'preview-error',
      error: error.message
    });
  }
}

// Process collection for preview (same logic as export)
async function processCollectionForPreview(collection, allVariables) {
  const collectionData = {};

  const variables = allVariables.filter(v => v.variableCollectionId === collection.id);

  for (const mode of collection.modes) {
    const modeData = {};

    for (const variable of variables) {
      const tokenPath = variable.name.split('/');
      const value = variable.valuesByMode[mode.modeId];

      if (value === undefined) continue;

      let currentLevel = modeData;
      for (let i = 0; i < tokenPath.length - 1; i++) {
        const part = tokenPath[i];
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }

      const tokenName = tokenPath[tokenPath.length - 1];
      let tokenValue;

      if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        const aliasPath = resolveAliasPath(value.id, allVariables);
        tokenValue = '{' + aliasPath + '}';
      } else if (variable.resolvedType === 'COLOR') {
        tokenValue = colorToHex(value);
      } else {
        tokenValue = value;
      }

      currentLevel[tokenName] = {
        $value: tokenValue,
        $type: variable.resolvedType === 'COLOR' ? 'color' : 'number'
      };

      if (variable.description) {
        currentLevel[tokenName].$description = variable.description;
      }
    }

    collectionData[mode.name] = modeData;
  }

  return collectionData;
}

// Handle parameter suggestions
figma.parameters.on('input', ({ key, query, result }) => {
  console.log('Parameter input event:', { key, query });
  
  if (key === 'collectionName') {
    // Get all collection names for suggestions
    figma.variables.getLocalVariableCollectionsAsync().then(collections => {
      const names = collections.map(c => c.name);
      console.log('Available collections:', names);
      const filtered = names.filter(name => 
        name.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Filtered suggestions:', filtered);
      result.setSuggestions(filtered);
    });
  }
});

// Handle plugin run with or without parameters
figma.on('run', async ({ command, parameters }) => {
  console.log('Run event:', { command, parameters });
  
  // Check if we have a collectionName parameter value
  const hasCollectionName = parameters && parameters.collectionName && parameters.collectionName.trim();
  
  if (command === 'export-collection' && hasCollectionName) {
    // Quick export specific collection
    console.log('Executing export-collection:', parameters.collectionName);
    await exportSpecificCollection(parameters.collectionName);
    figma.closePlugin();
  } else if (command === 'send-to-server' && hasCollectionName) {
    // Quick send to server
    console.log('Executing send-to-server:', parameters.collectionName);
    const result = await sendCollectionToServer(parameters.collectionName);
    figma.notify(result.message, { error: !result.success });
    figma.closePlugin();
  } else {
    // Open full UI for all other cases
    console.log('Opening UI - command:', command, 'parameters:', parameters);
    showPluginUI();
  }
});

// Show UI with theme support
function showPluginUI() {
  figma.showUI(__html__, { 
    width: 480, 
    height: 640,
    themeColors: true 
  });
  
  // Initialize settings when UI loads
  initializeSettings();
}

// Export specific collection by name
async function exportSpecificCollection(collectionName) {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collection = collections.find(c => 
      c.name.toLowerCase() === collectionName.toLowerCase()
    );
    
    if (!collection) {
      figma.notify(`Collection "${collectionName}" not found`, { error: true });
      return;
    }
    
    // Get all variables for alias resolution
    const allVariables = await figma.variables.getLocalVariablesAsync();
    
    // Process collection (same logic as export.js)
    const collectionData = {};
    const variables = collection.variableIds
      .map(id => allVariables.find(v => v.id === id))
      .filter(v => v);
    
    for (const variable of variables) {
      const modeValues = {};
      
      for (const modeId of collection.modes.map(m => m.modeId)) {
        const value = variable.valuesByMode[modeId];
        
        if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
          const aliasedVar = allVariables.find(v => v.id === value.id);
          if (aliasedVar) {
            modeValues[modeId] = `{${resolveAliasPath(aliasedVar, allVariables)}}`;
          }
        } else if (variable.resolvedType === 'COLOR') {
          modeValues[modeId] = colorToHex(value);
        } else {
          modeValues[modeId] = value;
        }
      }
      
      collectionData[variable.name] = {
        $type: variable.resolvedType.toLowerCase(),
        $value: collection.modes.length === 1 
          ? modeValues[collection.modes[0].modeId]
          : modeValues
      };
      
      if (variable.description) {
        collectionData[variable.name].$description = variable.description;
      }
    }
    
    // Parameters cannot download files - just notify user
    figma.notify(`✅ Exported "${collection.name}" collection (${variables.length} variables). Use Preview tab to view and copy.`);
    figma.closePlugin();
    
  } catch (error) {
    figma.notify(`Export failed: ${error.message}`, { error: true });
    figma.closePlugin();
  }
}

// Load and send settings to UI on startup
async function initializeSettings() {
  try {
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
        serverPort: 8947
      }
    });
  }
}

// Initialize settings when UI loads
initializeSettings();

// Message handler
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'close') {
      figma.closePlugin();
      return;
    }
    
    if (msg.type === 'clipboard-success') {
      figma.notify(`✅ Copied ${msg.fileName} to clipboard`);
      figma.closePlugin();
      return;
    }
    
    if (msg.type === 'clipboard-error') {
      figma.notify('Failed to copy to clipboard', { error: true });
      figma.closePlugin();
      return;
    }
    
    if (msg.type === 'show-notification') {
      // Handle native Figma notifications from UI
      figma.notify(msg.message, msg.options || {});
      return;
    }
    
    if (msg.type === 'import-tokens') {
      await importTokens(msg.data);
    } else if (msg.type === 'export-tokens') {
      await exportTokens(msg.settings || {});
    } else if (msg.type === 'load-preview') {
      // Load preview without downloading - send data to UI
      await loadPreview(msg.settings || {});
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
        figma.notify(result.message, { error: true });
        figma.ui.postMessage({
          type: 'server-error'
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
        figma.notify(result.message, { error: true });
        figma.ui.postMessage({
          type: 'server-error'
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
        figma.notify(result.message, { error: true });
        figma.ui.postMessage({
          type: 'server-error'
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
        figma.notify(result.message);
        figma.ui.postMessage({
          type: 'send-success'
        });
      } else {
        figma.notify(result.message, { error: true });
        figma.ui.postMessage({
          type: 'send-error'
        });
      }
    } else if (msg.type === 'send-collection') {
      // Send specific collection to local server
      const result = await sendCollectionToServer(msg.collectionName);
      if (result.success) {
        figma.notify(result.message);
        figma.ui.postMessage({
          type: 'send-success'
        });
      } else {
        figma.notify(result.message, { error: true });
        figma.ui.postMessage({
          type: 'send-error'
        });
      }
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.notify(`Operation failed: ${error.message}`, { error: true });
    figma.ui.postMessage({
      type: msg.type === 'import-tokens' ? 'import-error' : 'export-error'
    });
  }
};

