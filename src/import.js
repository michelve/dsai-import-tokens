/**
 * DSAI Import Tokens Plugin - Import Module
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Import functionality - imports tokens into Figma variables

import { isAlias, parseColor, mapScopes } from './utils.js';

export async function importTokens(data) {
  // Input validation
  if (!data) {
    throw new Error('No data provided. Please select a valid JSON file.');
  }
  
  if (typeof data !== 'object') {
    throw new Error('Invalid file format. Expected a JSON object.');
  }
  
  // Support both array format [{ Collections: {...} }] and direct object
  const tokenData = Array.isArray(data) ? data[0] : data;
  
  if (!tokenData || typeof tokenData !== 'object') {
    throw new Error('Invalid token data structure.');
  }
  
  if (Object.keys(tokenData).length === 0) {
    throw new Error('Empty file. No collections found to import.');
  }

  figma.ui.postMessage({
    type: 'import-progress',
    message: 'Processing token data...',
  });

  let createdCount = 0;
  let updatedCount = 0;

  // Process each collection
  for (const [collectionName, collectionData] of Object.entries(tokenData)) {
    figma.ui.postMessage({
      type: 'import-progress',
      message: `Processing collection: ${collectionName}...`,
    });

    // Find or create collection
    const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = allCollections.find((c) => c.name === collectionName);

    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
      createdCount++;
    } else {
      updatedCount++;
    }

    // Store tokens and aliases for processing
    const tokens = {};
    const aliases = {};

    // Process modes
    if (collectionData.modes) {
      const modeNames = Object.keys(collectionData.modes);

      // Set up modes
      const existingModes = collection.modes;

      // Rename or create modes to match token data
      for (let i = 0; i < modeNames.length; i++) {
        const modeName = modeNames[i];

        if (i < existingModes.length) {
          // Rename existing mode
          collection.renameMode(existingModes[i].modeId, modeName);
        } else {
          // Add new mode
          collection.addMode(modeName);
        }
      }

      // Get updated modes after setup
      const modes = collection.modes;

      // Process all token groups (colors, spacing, components, etc.) for first mode
      const firstModeName = modeNames[0];
      const firstModeData = collectionData.modes[firstModeName];
      const modeId = modes[0].modeId;

      // Loop through all groups in the mode (colors, spacing, components, etc.)
      for (const [groupName, groupData] of Object.entries(firstModeData)) {
        if (groupData && typeof groupData === 'object') {
          await traverseTokens({
            collection,
            modeId,
            type: undefined, // Don't override type - let tokens define their own $type
            object: groupData,
            tokens,
            aliases,
            key: groupName,
          });
        }
      }

      // Process aliases after all tokens are created
      await processAliases({ collection, modeId, aliases, tokens });

      // Now set values for other modes
      for (let modeIndex = 1; modeIndex < modeNames.length; modeIndex++) {
        const modeName = modeNames[modeIndex];
        const modeData = collectionData.modes[modeName];
        const modeModeId = modes[modeIndex].modeId;

        // Loop through all groups in the mode
        for (const [groupName, groupData] of Object.entries(modeData)) {
          if (groupData && typeof groupData === 'object') {
            await setModeValues({
              modeId: modeModeId,
              object: groupData,
              tokens,
              key: groupName,
            });
          }
        }
      }
    }
  }

  // Show native Figma notification
  figma.notify(`✅ Import complete! ${createdCount} created, ${updatedCount} updated`);
  
  figma.ui.postMessage({
    type: 'import-success'
  });
}

async function traverseTokens({ collection, modeId, type, object, tokens, aliases, key }) {
  for (const [tokenKey, tokenValue] of Object.entries(object)) {
    // Skip meta fields
    if (tokenKey.charAt(0) === '$') {
      continue;
    }

    const fullKey = key ? `${key}/${tokenKey}` : tokenKey;

    // Check if this is a token with a value
    if (tokenValue.$value !== undefined) {
      const tokenType = type || tokenValue.$type;

      if (isAlias(tokenValue.$value)) {
        // Handle alias reference
        let valueKey = tokenValue.$value
          .trim()
          .replace(/[\{\}]/g, '') // Remove braces
          .replace(/\./g, '/'); // Convert dots to slashes

        console.log(`🔍 Alias detected: ${fullKey} → ${tokenValue.$value} → ${valueKey}`);

        // If the alias doesn't already start with a group path, prepend it from current context
        if (
          !valueKey.startsWith('colors/') &&
          !valueKey.startsWith('spacing/') &&
          !valueKey.startsWith('components/')
        ) {
          // Extract the group name from the current key (e.g., 'colors' from 'colors/theme/primary')
          const groupName = key.split('/')[0];
          if (
            groupName &&
            (valueKey.startsWith('brand/') ||
              valueKey.startsWith('neutral/') ||
              valueKey.startsWith('theme/'))
          ) {
            valueKey = `${groupName}/${valueKey}`;
            console.log(`  ✏️ Prepended group: ${valueKey}`);
          }
        }

        if (tokens[valueKey]) {
          // Create alias immediately if target exists
          tokens[fullKey] = await createVariableAlias(
            collection,
            modeId,
            fullKey,
            valueKey,
            tokens,
            tokenValue,
            tokenType
          );
        } else {
          // Store for later processing
          aliases[fullKey] = {
            key: fullKey,
            type: tokenType,
            valueKey,
            description: tokenValue.$description,
            scopes: tokenValue.$scopes,
          };
        }
      } else {
        // Create variable with direct value based on type
        console.log(`✅ Creating token: ${fullKey} (${tokenType}) = ${tokenValue.$value}`);
        try {
          tokens[fullKey] = await createVariable(collection, modeId, fullKey, tokenValue, tokenType);
        } catch (error) {
          console.error(`❌ Error creating token ${fullKey}:`, error.message);
          throw error;
        }
      }
    } else {
      // Recurse into nested objects
      await traverseTokens({
        collection,
        modeId,
        type: type || tokenValue.$type,
        object: tokenValue,
        tokens,
        aliases,
        key: fullKey,
      });
    }
  }
}

async function createVariable(collection, modeId, name, token, tokenType) {
  // Map token types to Figma variable types
  const typeMap = {
    color: 'COLOR',
    string: 'STRING',
    number: 'FLOAT',
    boolean: 'BOOLEAN',
  };

  const figmaType = typeMap[tokenType] || 'STRING';

  // Try to find existing variable first
  const allVariables = await figma.variables.getLocalVariablesAsync(figmaType);
  let variable = allVariables.find(
    (v) => v.name === name && v.variableCollectionId === collection.id
  );

  if (!variable) {
    try {
      variable = figma.variables.createVariable(name, collection, figmaType);
      console.log(`  ✨ Created variable: ${name}`);
    } catch (error) {
      console.error(`  ❌ Failed to create variable ${name}:`, error.message);
      // Try to find it again - maybe it exists with a different type or was just created
      const allTypes = ['COLOR', 'STRING', 'FLOAT', 'BOOLEAN'];
      for (const searchType of allTypes) {
        const variables = await figma.variables.getLocalVariablesAsync(searchType);
        variable = variables.find(
          (v) => v.name === name && v.variableCollectionId === collection.id
        );
        if (variable) {
          console.log(`  🔄 Found existing variable with type ${searchType}: ${name}`);
          break;
        }
      }
      if (!variable) {
        throw error;
      }
    }
  } else {
    console.log(`  ♻️ Reusing existing variable: ${name}`);
  }

  // Set value based on type
  let value;
  if (tokenType === 'color') {
    value = parseColor(token.$value);
  } else if (tokenType === 'number') {
    value = parseFloat(token.$value);
  } else if (tokenType === 'boolean') {
    value = token.$value === true || token.$value === 'true';
  } else {
    // string or any other type
    value = token.$value.toString();
  }

  variable.setValueForMode(modeId, value);

  // Build description with extensions if available
  let description = token.$description || '';

  if (token.$extensions) {
    const extensionLines = [];

    // Generic handler for any nested structure
    function processExtensions(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const label = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively process nested objects
          processExtensions(value, label);
        } else {
          // Format the key nicely (capitalize first letter of each word)
          const formattedKey = label
            .split('.')
            .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
            .join('.');
          extensionLines.push(`${formattedKey}: ${value}`);
        }
      }
    }

    processExtensions(token.$extensions);

    if (extensionLines.length > 0) {
      const extensionsBlock = extensionLines.join(' • ');
      description = description ? `${description}\n\n${extensionsBlock}` : extensionsBlock;
    }
  }

  if (description) {
    variable.description = description;
  }

  // Set code syntax for each platform
  if (token.$codeSyntax) {
    if (token.$codeSyntax.WEB) {
      variable.setVariableCodeSyntax('WEB', token.$codeSyntax.WEB);
    }
    if (token.$codeSyntax.ANDROID) {
      variable.setVariableCodeSyntax('ANDROID', token.$codeSyntax.ANDROID);
    }
    if (token.$codeSyntax.iOS) {
      variable.setVariableCodeSyntax('iOS', token.$codeSyntax.iOS);
    }
  }

  if (token.$scopes) {
    variable.scopes = mapScopes(token.$scopes);
  }

  return variable;
}

async function createVariableAlias(collection, modeId, name, valueKey, tokens, token, tokenType) {
  const targetVariable = tokens[valueKey];

  // Map token types to Figma variable types
  const typeMap = {
    color: 'COLOR',
    string: 'STRING',
    number: 'FLOAT',
    boolean: 'BOOLEAN',
  };

  const figmaType = typeMap[tokenType] || targetVariable.resolvedType;

  // Try to find existing variable first
  const allVariables = await figma.variables.getLocalVariablesAsync(figmaType);
  let variable = allVariables.find(
    (v) => v.name === name && v.variableCollectionId === collection.id
  );

  if (!variable) {
    variable = figma.variables.createVariable(name, collection, figmaType);
  }

  variable.setValueForMode(modeId, {
    type: 'VARIABLE_ALIAS',
    id: targetVariable.id,
  });

  // Build description with extensions if available
  let description = token && token.$description ? token.$description : '';

  if (token && token.$extensions) {
    const extensionLines = [];

    // Generic handler for any nested structure
    function processExtensions(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const label = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively process nested objects
          processExtensions(value, label);
        } else {
          // Format the key nicely (capitalize first letter of each word)
          const formattedKey = label
            .split('.')
            .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
            .join('.');
          extensionLines.push(`${formattedKey}: ${value}`);
        }
      }
    }

    processExtensions(token.$extensions);

    if (extensionLines.length > 0) {
      const extensionsBlock = extensionLines.join(' • ');
      description = description ? `${description}\n\n${extensionsBlock}` : extensionsBlock;
    }
  }

  if (description) {
    variable.description = description;
  }

  // Set code syntax for each platform
  if (token && token.$codeSyntax) {
    if (token.$codeSyntax.WEB) {
      variable.setVariableCodeSyntax('WEB', token.$codeSyntax.WEB);
    }
    if (token.$codeSyntax.ANDROID) {
      variable.setVariableCodeSyntax('ANDROID', token.$codeSyntax.ANDROID);
    }
    if (token.$codeSyntax.iOS) {
      variable.setVariableCodeSyntax('iOS', token.$codeSyntax.iOS);
    }
  }

  if (token && token.$scopes) {
    variable.scopes = mapScopes(token.$scopes);
  }

  return variable;
}

async function processAliases({ collection, modeId, aliases, tokens }) {
  const aliasArray = Object.values(aliases);
  let generations = aliasArray.length;

  console.log('Processing', aliasArray.length, 'aliases');
  console.log('Available tokens:', Object.keys(tokens).slice(0, 10));

  while (aliasArray.length && generations > 0) {
    for (let i = 0; i < aliasArray.length; i++) {
      const { key, type, valueKey, description, scopes } = aliasArray[i];
      let targetVariable = tokens[valueKey];

      // If not found in current collection, search across all collections
      if (!targetVariable) {
        console.log(`  🔎 Searching for cross-collection alias: ${valueKey} (type: ${type})`);
        const typeMap = { color: 'COLOR', string: 'STRING', number: 'FLOAT', boolean: 'BOOLEAN' };
        const figmaType = typeMap[type] || 'COLOR';
        const allVariables = await figma.variables.getLocalVariablesAsync(figmaType);
        console.log(`  📋 Found ${allVariables.length} variables of type ${figmaType}`);
        console.log(
          `  📋 Sample variable names:`,
          allVariables.slice(0, 5).map((v) => v.name)
        );
        targetVariable = allVariables.find((v) => v.name === valueKey);
        if (targetVariable) {
          console.log('🔗 Found cross-collection reference:', valueKey);
          // Store it for future use
          tokens[valueKey] = targetVariable;
        } else {
          console.log(`  ❌ Cross-collection alias not found: ${valueKey}`);
        }
      }

      if (targetVariable) {
        aliasArray.splice(i, 1);
        tokens[key] = await createVariableAlias(
          collection,
          modeId,
          key,
          valueKey,
          tokens,
          {
            $description: description,
            $scopes: scopes,
          },
          type
        );
        console.log('✓ Resolved alias:', key, '→', valueKey);
        i--;
      } else {
        console.log('✗ Cannot resolve alias:', key, '→', valueKey, '(target not found)');
      }
    }
    generations--;
  }

  if (aliasArray.length > 0) {
    console.log('Warning:', aliasArray.length, 'aliases could not be resolved');
  }
}

async function setModeValues({ modeId, object, tokens, key }) {
  for (const [tokenKey, tokenValue] of Object.entries(object)) {
    // Skip meta fields
    if (tokenKey.charAt(0) === '$') {
      continue;
    }

    const fullKey = key ? `${key}/${tokenKey}` : tokenKey;

    // Check if this is a token with a value
    if (tokenValue.$value !== undefined) {
      const variable = tokens[fullKey];

      if (variable) {
        const tokenType = tokenValue.$type;

        if (isAlias(tokenValue.$value)) {
          // Set alias for this mode
          let valueKey = tokenValue.$value
            .trim()
            .replace(/[\{\}]/g, '') // Remove braces
            .replace(/\./g, '/'); // Convert dots to slashes

          // If the alias doesn't already start with a group path, prepend it from current context
          if (
            !valueKey.startsWith('colors/') &&
            !valueKey.startsWith('spacing/') &&
            !valueKey.startsWith('components/')
          ) {
            // Extract the group name from the current key (e.g., 'colors' from 'colors/theme/primary')
            const groupName = key.split('/')[0];
            if (
              groupName &&
              (valueKey.startsWith('brand/') ||
                valueKey.startsWith('neutral/') ||
                valueKey.startsWith('theme/'))
            ) {
              valueKey = `${groupName}/${valueKey}`;
            }
          }

          let targetVariable = tokens[valueKey];

          // If not found in current collection, search across all collections
          if (!targetVariable) {
            console.log(
              `  🔎 [Dark Mode] Searching for cross-collection alias: ${valueKey} (type: ${tokenType})`
            );
            const typeMap = {
              color: 'COLOR',
              string: 'STRING',
              number: 'FLOAT',
              boolean: 'BOOLEAN',
            };
            const figmaType = typeMap[tokenType] || 'COLOR';
            const allVariables = await figma.variables.getLocalVariablesAsync(figmaType);
            targetVariable = allVariables.find((v) => v.name === valueKey);
            if (targetVariable) {
              console.log(`  🔗 [Dark Mode] Found cross-collection reference: ${valueKey}`);
              // Store it for future use
              tokens[valueKey] = targetVariable;
            } else {
              console.log(`  ❌ [Dark Mode] Cross-collection alias not found: ${valueKey}`);
            }
          }

          if (targetVariable) {
            variable.setValueForMode(modeId, {
              type: 'VARIABLE_ALIAS',
              id: targetVariable.id,
            });
          } else {
            console.log(`  ⚠️ [Dark Mode] Cannot resolve alias for ${fullKey} → ${valueKey}`);
          }
        } else {
          // Set direct value for this mode based on type
          let value;
          if (tokenType === 'color') {
            value = parseColor(tokenValue.$value);
          } else if (tokenType === 'number') {
            value = parseFloat(tokenValue.$value);
          } else if (tokenType === 'boolean') {
            value = tokenValue.$value === true || tokenValue.$value === 'true';
          } else {
            // string or any other type
            value = tokenValue.$value.toString();
          }
          variable.setValueForMode(modeId, value);
        }
      }
    } else {
      // Recurse into nested objects
      await setModeValues({
        modeId,
        object: tokenValue,
        tokens,
        key: fullKey,
      });
    }
  }
}
