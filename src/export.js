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

    // Version marker to confirm new code is running
    console.log('✓ Export v2.0 - with metadata parsing');
    
    const exportFormat = settings.exportFormat || 'single';

    // Get all variables once for reference resolution
    const allVariables = await getAllVariables();
    
    // DEBUG: Log first 10 variable names
    console.log('Total variables found:', allVariables.length);
    console.log('First 10 variable names:');
    for (var i = 0; i < Math.min(10, allVariables.length); i++) {
      console.log('  ' + i + ':', allVariables[i].name);
    }

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
  const collectionData = {
    modes: {}
  };

  // Get all variables in this collection
  const variables = allVariables.filter(v => v.variableCollectionId === collection.id);
  
  console.log('Processing collection:', collection.name, '- Variables:', variables.length, 'Modes:', collection.modes.length);

  // Process each mode
  for (const mode of collection.modes) {
    const modeData = {};
    console.log('  Processing mode:', mode.name);

    // Group variables by their path structure
    for (const variable of variables) {
      const tokenPath = variable.name.split('/');
      const value = variable.valuesByMode[mode.modeId];
      
      if (variable.name === 'colors/brand/orange/800') {
        console.log('    FOUND orange/800 in mode', mode.name, '- value:', value);
        console.log('    About to call variableToToken...');
      }

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
      
      if (variable.name === 'colors/brand/orange/800') {
        console.log('    variableToToken returned:');
        console.log('      $description:', token.$description);
        console.log('      $codeSyntax:', JSON.stringify(token.$codeSyntax));
        console.log('      $extensions:', JSON.stringify(token.$extensions));
      }
      
      current[tokenName] = token;
    }

    collectionData.modes[mode.name] = modeData;
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

function parseDescriptionMetadata(description) {
  var result = {
    description: '',
    codeSyntax: {},
    extensions: {} // Always return object, never undefined
  };
  
  if (!description) return result;
  
  // Split by multiple newlines (more flexible whitespace handling)
  var parts = description.split(/\n\s*\n/);
  var cleanDescParts = [];
  
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i].trim();
    
    // Check if this part contains metadata markers
    if (/Docs\.|Platform\./.test(part)) {
      // This is a metadata section - parse it
      var metadataItems = part.split('•');
      
      for (var j = 0; j < metadataItems.length; j++) {
        var item = metadataItems[j].trim();
        
        var colonIndex = item.indexOf(':');
        if (colonIndex === -1) continue;
        
        // Better key-value splitting (handles URLs with colons)
        var key = item.substring(0, colonIndex).trim();
        var value = item.substring(colonIndex + 1).trim();
        
        // Use switch for cleaner mapping
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
            if (key.indexOf('Platform.') === 0) {
              if (!result.extensions.platform) result.extensions.platform = {};
              var platformKey = key.substring(9); // Remove "Platform."
              // Convert to camelCase
              platformKey = platformKey.charAt(0).toLowerCase() + platformKey.slice(1);
              result.extensions.platform[platformKey] = value;
            }
            break;
        }
      }
    } else if (part.length > 0) {
      // This is regular description text
      cleanDescParts.push(part);
    }
  }
  
  // Join clean description parts
  result.description = cleanDescParts.join('\n\n').trim();
  
  return result;
}

function variableToToken(variable, value, allVariables) {
  const token = {
    $value: null,
    $type: getTokenType(variable.resolvedType),
  };

  // DEBUG: Check what's happening with parsing
  if (variable.name === 'colors/brand/orange/800') {
    console.log('=== INSIDE variableToToken for orange/800 ===');
    console.log('variable.description?', !!variable.description);
    console.log('About to call parseDescriptionMetadata...');
  }

  // Parse description to extract metadata and clean description
  if (variable.description) {
    const parsed = parseDescriptionMetadata(variable.description);
    
    if (variable.name === 'colors/brand/orange/800') {
      console.log('parseDescriptionMetadata returned:');
      console.log('  parsed.description length:', parsed.description.length);
      console.log('  parsed.description:', parsed.description);
      console.log('  parsed.codeSyntax:', JSON.stringify(parsed.codeSyntax));
      console.log('  parsed.extensions:', JSON.stringify(parsed.extensions));
    }
    
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
    
    if (isTestCase) {
      console.log('Final token.$description:', token.$description ? token.$description.substring(0, 100) : 'NONE');
      console.log('Final token.$codeSyntax:', JSON.stringify(token.$codeSyntax));
      console.log('Final token.$extensions:', JSON.stringify(token.$extensions));
    }
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
