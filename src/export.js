/**
 * DSAI Import Tokens Plugin - Export Module
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Export functionality - exports Figma variables to token format

import { colorToHex, resolveAliasPath } from './utils.js';

export async function exportTokens(settings = {}) {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    if (!collections || collections.length === 0) {
      figma.notify(
        'No variable collections found.\n\nCreate some variables first, then try exporting again.',
        { error: true, timeout: 5000 }
      );
      figma.ui.postMessage({
        type: 'export-error',
        message: 'No variable collections found to export.',
      });
      return;
    }

    const exportFormat = settings.exportFormat || 'single';

    // Get all variables once for reference resolution
    const allVariables = await getAllVariables();

    if (exportFormat === 'separate') {
      // Export each collection as a separate file
      const files = [];
      
      for (const collection of collections) {
        figma.ui.postMessage({
          type: 'export-progress',
          message: `Exporting collection: ${collection.name}...`,
        });

        const collectionData = await processCollection(collection, allVariables);
        
        // Create individual file for this collection
        const fileName = `${collection.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        files.push({
          name: fileName,
          data: { [collection.name]: collectionData }
        });
      }

      // Send multiple files to UI
      figma.notify(`✅ Exported ${collections.length} collection(s) as separate files`);
      figma.ui.postMessage({
        type: 'export-complete',
        files: files
      });

    } else {
      // Export all collections to a single file
      const tokenData = {};

      for (const collection of collections) {
        tokenData[collection.name] = await processCollection(collection, allVariables);
      }

      // Send single file to UI
      figma.notify(`✅ Exported ${collections.length} collection(s) to single file`);
      figma.ui.postMessage({
        type: 'export-complete',
        data: tokenData
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    figma.notify(`Export failed: ${error.message}`, { error: true });
    figma.ui.postMessage({
      type: 'export-error'
    });
  }
}

async function processCollection(collection, allVariables) {
  const collectionData = {};

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
      const token = variableToToken(variable, value, allVariables);
      current[tokenName] = token;
    }

    collectionData[mode.name] = modeData;
  }

  return collectionData;
}

async function getAllVariables() {
  const allVariables = [];
  const types = ['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'];
  
  for (const type of types) {
    const variables = await figma.variables.getLocalVariablesAsync(type);
    allVariables.push(...variables);
  }
  
  return allVariables;
}

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
  // Check if value is an alias object - it has 'type' and 'id' properties
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
    // No value found
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

function getTokenType(figmaType) {
  const typeMap = {
    COLOR: 'color',
    FLOAT: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
  };
  return typeMap[figmaType] || 'string';
}

function formatValue(value, type) {
  // Safety check for alias objects that shouldn't be here
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
