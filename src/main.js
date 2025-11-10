// Main plugin entry point

import { importTokens } from './import.js';
import { exportTokens } from './export.js';

// Show UI
figma.showUI(__html__, { width: 400, height: 450 });

// Load and send settings to UI on startup
async function initializeSettings() {
  try {
    const exportFormat = await figma.clientStorage.getAsync('exportFormat');
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: {
        exportFormat: exportFormat || 'single'
      }
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    // Send default settings
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: {
        exportFormat: 'single'
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
      figma.ui.postMessage({
        type: 'settings-loaded',
        settings: {
          exportFormat: exportFormat || 'single'
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
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: msg.type === 'import-tokens' ? 'import-error' : 'export-error',
      message: `Operation failed: ${error.message}`,
    });
  }
};
