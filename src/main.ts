/**
 * DSAI Import Tokens Plugin
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For use with DSAI design system only.
 */

// Main plugin entry point

import { importTokens } from './import';
import { exportTokens } from './export';
import { startServer, stopServer, getServerStatus, sendThemeToServer, sendCollectionToServer } from './server';
import { colorToHex, resolveAliasPath } from './utils';
import { scanForHexValues, applyHexMappings } from './hexMapping';
import { scanForProperties, applyPropertyMappings } from './scopeMapping';
import type { PluginSettings } from './types';

// Load preview for display in UI (similar to export but sends to textarea instead of download)
async function loadPreview(settings: PluginSettings = {}): Promise<void> {
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
      const tokenData: Record<string, any> = {};

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Preview error:', error);
    figma.ui.postMessage({
      type: 'preview-error',
      error: errorMessage
    });
  }
}

// Process collection for preview (same logic as export)
async function processCollectionForPreview(collection: VariableCollection, allVariables: Variable[]): Promise<any> {
  const collectionData: Record<string, any> = {};

  const variables = allVariables.filter((v: Variable) => v.variableCollectionId === collection.id);

  for (const mode of collection.modes) {
    const modeData: Record<string, any> = {};

    for (const variable of variables) {
      const tokenPath = variable.name.split('/');
      const value = variable.valuesByMode[mode.modeId];

      if (value === undefined) continue;

      let currentLevel: any = modeData;
      for (let i = 0; i < tokenPath.length - 1; i++) {
        const part = tokenPath[i];
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }

      const tokenName = tokenPath[tokenPath.length - 1];
      let tokenValue: any;

      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        const aliasPath = resolveAliasPath((value as VariableAlias).id, allVariables);
        tokenValue = '{' + aliasPath + '}';
      } else if (variable.resolvedType === 'COLOR') {
        tokenValue = colorToHex(value as RGB | RGBA);
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
async function exportSpecificCollection(collectionName: string): Promise<void> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collection = collections.find((c: VariableCollection) =>
      c.name.toLowerCase() === collectionName.toLowerCase()
    );

    if (!collection) {
      const availableNames = collections.map((c: VariableCollection) => '"' + c.name + '"').join(', ');
      figma.notify(
        'Collection "' + collectionName + '" not found.\n\nAvailable: ' + (availableNames || 'none'),
        { error: true, timeout: 6000 }
      );
      return;
    }

    // Get all variables for alias resolution
    const allVariables = await figma.variables.getLocalVariablesAsync();

    // Process collection (same logic as export.js)
    const collectionData: Record<string, any> = {};
    const variables = collection.variableIds
      .map((id: string) => allVariables.find((v: Variable) => v.id === id))
      .filter((v: Variable | undefined): v is Variable => v !== undefined);

    for (const variable of variables) {
      const modeValues: Record<string, any> = {};

      for (const modeId of collection.modes.map((m) => m.modeId)) {
        const value = variable.valuesByMode[modeId];

        if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
          const aliasedVar = allVariables.find((v: Variable) => v.id === (value as VariableAlias).id);
          if (aliasedVar) {
            modeValues[modeId] = `{${resolveAliasPath(aliasedVar.id, allVariables)}}`;
          }
        } else if (variable.resolvedType === 'COLOR') {
          modeValues[modeId] = colorToHex(value as RGB | RGBA);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    figma.notify(`Export failed: ${errorMessage}`, { error: true });
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

// Helper function for user-friendly error messages
function getFriendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return '📡 Network error. Check your connection and try again.';
  }
  if (message.includes('json') || message.includes('parse')) {
    return '📄 Invalid JSON file. Please check the file format.';
  }
  if (message.includes('collection')) {
    return '📁 Error accessing variable collection: ' + (error instanceof Error ? error.message : message);
  }
  if (message.includes('permission') || message.includes('access')) {
    return '🔒 Permission denied. Check plugin permissions.';
  }
  if (message.includes('not found')) {
    return '🔍 Not found: ' + (error instanceof Error ? error.message : message);
  }
  if (message.includes('empty')) {
    return '⚠️ No data found. ' + (error instanceof Error ? error.message : message);
  }
  if (message.includes('timeout')) {
    return '⏱️ Operation timed out. Try smaller collections or refresh.';
  }

  return '❌ ' + (error instanceof Error ? error.message : String(error));
}

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
    } else if (msg.type === 'load-collections') {
      // Load available collections and send to UI
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collectionList = collections.map(c => ({
        id: c.id,
        name: c.name
      }));
      figma.ui.postMessage({
        type: 'collections-loaded',
        collections: collectionList
      });
    } else if (msg.type === 'export-tokens') {
      await exportTokens(msg.settings || {}, msg.collectionId || null);
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
      // Validate port
      const port = msg.port;

      if (!port || typeof port !== 'number') {
        figma.notify('Invalid port number', { error: true });
        figma.ui.postMessage({ type: 'server-error' });
        return;
      }

      if (port < 1024 || port > 65535) {
        figma.notify(
          'Port must be between 1024 and 65535',
          { error: true, timeout: 4000 }
        );
        figma.ui.postMessage({ type: 'server-error' });
        return;
      }

      // Start the HTTP server
      const result = await startServer(port);
      if (result.success) {
        await figma.clientStorage.setAsync('serverEnabled', true);
        await figma.clientStorage.setAsync('serverPort', result.port);
        figma.ui.postMessage({
          type: 'server-started',
          port: result.port
        });
      } else {
        // Improve error message
        let errorMsg = result.message || 'Failed to start server';

        if (errorMsg.indexOf('EADDRINUSE') !== -1) {
          errorMsg = 'Port ' + port + ' is already in use. Try a different port.';
        } else if (errorMsg.indexOf('EACCES') !== -1) {
          errorMsg = 'Permission denied. Ports below 1024 require admin rights.';
        }

        figma.notify(errorMsg, { error: true, timeout: 5000 });
        figma.ui.postMessage({ type: 'server-error' });
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
    } else if (msg.type === 'scan-hex-values') {
      // Scan for hardcoded hex values
      try {
        const scope = msg.scope || 'current';
        const result = await scanForHexValues(scope);

        if (result.mappings.length === 0) {
          figma.notify('No hardcoded hex values found matching existing variables');
          figma.ui.postMessage({
            type: 'scan-complete',
            mappings: [],
            modes: result.modes
          });
        } else {
          figma.notify(`Found ${result.mappings.length} hex value(s) matching variables`);
          figma.ui.postMessage({
            type: 'scan-complete',
            mappings: result.mappings,
            modes: result.modes
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to scan for hex values';
        figma.notify(errorMessage, { error: true });
        figma.ui.postMessage({
          type: 'scan-error',
          error: errorMessage
        });
      }
    } else if (msg.type === 'apply-hex-mappings') {
      // Apply selected hex mappings
      try {
        const mappings = msg.mappings || [];
        const mode = msg.mode || 'Light';

        if (mappings.length === 0) {
          throw new Error('No mappings provided');
        }

        const result = await applyHexMappings(mappings, mode);

        if (result.errorCount > 0) {
          figma.notify(
            `✅ Applied ${result.appliedCount} mapping(s) with ${result.errorCount} error(s)`,
            { error: true }
          );
        } else {
          figma.notify(`✅ Successfully applied ${result.appliedCount} mapping(s)`);
        }

        figma.ui.postMessage({
          type: 'mappings-applied',
          appliedCount: result.appliedCount,
          errorCount: result.errorCount
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to apply mappings';
        figma.notify(errorMessage, { error: true });
        figma.ui.postMessage({
          type: 'mappings-error',
          error: errorMessage
        });
      }
    } else if (msg.type === 'scan-property-values') {
      // Scan for hardcoded property values
      try {
        const scope = msg.scope || 'current';
        const result = await scanForProperties(scope);

        if (result.mappings.length === 0) {
          figma.notify('No hardcoded properties found matching existing variables');
          figma.ui.postMessage({
            type: 'property-scan-complete',
            mappings: [],
            propertyTypes: result.propertyTypes
          });
        } else {
          figma.notify(`Found ${result.mappings.length} propert${result.mappings.length === 1 ? 'y' : 'ies'} matching variables`);
          figma.ui.postMessage({
            type: 'property-scan-complete',
            mappings: result.mappings,
            propertyTypes: result.propertyTypes
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to scan for properties';
        figma.notify(errorMessage, { error: true });
        figma.ui.postMessage({
          type: 'property-scan-error',
          error: errorMessage
        });
      }
    } else if (msg.type === 'apply-property-mappings') {
      // Apply selected property mappings
      try {
        const mappings = msg.mappings || [];

        if (mappings.length === 0) {
          throw new Error('No mappings provided');
        }

        const result = await applyPropertyMappings(mappings);

        if (result.errorCount > 0) {
          figma.notify(
            `✅ Applied ${result.appliedCount} mapping(s) with ${result.errorCount} error(s)`,
            { error: true }
          );
        } else {
          figma.notify(`✅ Successfully applied ${result.appliedCount} mapping(s)`);
        }

        figma.ui.postMessage({
          type: 'property-mappings-applied',
          appliedCount: result.appliedCount,
          errorCount: result.errorCount
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to apply property mappings';
        figma.notify(errorMessage, { error: true });
        figma.ui.postMessage({
          type: 'property-mappings-error',
          error: errorMessage
        });
      }
    }
  } catch (error) {
    console.error('Plugin error:', error);

    const friendlyMessage = getFriendlyErrorMessage(error);

    figma.notify(friendlyMessage, {
      error: true,
      timeout: 5000
    });

    figma.ui.postMessage({
      type: 'error',
      operation: msg.type,
      userMessage: friendlyMessage,
      technicalDetails: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

