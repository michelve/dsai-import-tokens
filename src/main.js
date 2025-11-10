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
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: msg.type === 'import-tokens' ? 'import-error' : 'export-error',
      message: `Operation failed: ${error.message}`,
    });
  }
};

