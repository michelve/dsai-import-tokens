/**
 * DSAI Import Tokens Plugin - Variable Reference Manager
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

import { colorToHex } from './utils';

// Variable Reference Management - Find, match, and rebind broken variable references

/**
 * Types for variable reference management
 */

export interface BrokenReference {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  property: string;
  variableId: string;
  variableName?: string; // If we can still resolve the variable
  collectionId?: string;
  collectionName?: string;
  issue: 'deleted' | 'missing' | 'moved' | 'unknown';
  currentValue?: string | number | RGB | RGBA;
}

export interface VariableMatch {
  variableId: string;
  variableName: string;
  collectionName: string;
  collectionId: string;
  similarity: number; // 0-100 score
  reason: string; // Why this is a match
  aliasPath?: string; // If this is an alias, the path to what it aliases
  hexValue?: string; // For colors, the hex value
}

export interface RemapSuggestion {
  brokenRef: BrokenReference;
  matches: VariableMatch[];
}

export interface ReferenceReport {
  totalNodes: number;
  nodesWithVariables: number;
  totalReferences: number;
  brokenReferences: BrokenReference[];
  remapSuggestions: RemapSuggestion[];
  scannedAt: Date;
}

/**
 * Scan for broken variable references
 * @param scope - 'selection' | 'current' (current page) | 'all' (all pages)
 */
export async function scanBrokenReferences(scope: 'selection' | 'current' | 'all' = 'all'): Promise<ReferenceReport> {
  const report: ReferenceReport = {
    totalNodes: 0,
    nodesWithVariables: 0,
    totalReferences: 0,
    brokenReferences: [],
    remapSuggestions: [],
    scannedAt: new Date(),
  };

  // Get all local variables for validation
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariableIds = new Set<string>();
  
  for (const collection of allCollections) {
    for (const varId of collection.variableIds) {
      allVariableIds.add(varId);
    }
  }

  // Get nodes based on scope
  let nodesToScan: ReadonlyArray<SceneNode> = [];
  
  if (scope === 'selection') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      throw new Error('No nodes selected. Please select at least one node.');
    }
    // Get selection and all their descendants
    const allNodesInSelection: SceneNode[] = [];
    for (const node of selection) {
      allNodesInSelection.push(node);
      if ('findAll' in node) {
        allNodesInSelection.push(...node.findAll());
      }
    }
    nodesToScan = allNodesInSelection;
  } else if (scope === 'current') {
    // Scan current page only
    nodesToScan = figma.currentPage.findAll();
  } else {
    // Scan all pages
    await figma.loadAllPagesAsync();
    nodesToScan = figma.root.findAll().filter(node => node.type !== 'PAGE') as SceneNode[];
  }
  
  report.totalNodes = nodesToScan.length;

  for (const node of nodesToScan) {
    // Check if node has bound variables
    if ('boundVariables' in node && node.boundVariables) {
      const boundVars = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;
      let nodeHasVariables = false;

      // Check each property that could have a bound variable
      for (const [property, binding] of Object.entries(boundVars)) {
        if (!binding) continue;

        const bindings = Array.isArray(binding) ? binding : [binding];
        
        for (const varAlias of bindings) {
          if (!varAlias || !varAlias.id) continue;

          nodeHasVariables = true;
          report.totalReferences++;

          // Check if this variable still exists
          if (!allVariableIds.has(varAlias.id)) {
            // Variable is broken/missing
            const brokenRef: BrokenReference = {
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.type,
              property: property,
              variableId: varAlias.id,
              issue: 'deleted',
            };

            // Try to get the old variable name (Figma might still have it cached)
            try {
              const variable = await figma.variables.getVariableByIdAsync(varAlias.id);
              if (variable) {
                brokenRef.variableName = variable.name;
                // Try to get collection name too
                const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
                if (collection) {
                  brokenRef.collectionName = collection.name;
                }
              }
            } catch {
              // Variable truly deleted, name not available
              brokenRef.variableName = undefined;
            }

            // Try to get current value from the node
            try {
              if (property in node) {
                brokenRef.currentValue = (node as unknown as Record<string, unknown>)[property] as string | number | RGB | RGBA;
              }
            } catch {
              // Some properties might not be accessible
            }

            report.brokenReferences.push(brokenRef);
          }
        }
      }

      if (nodeHasVariables) {
        report.nodesWithVariables++;
      }
    }
  }

  // Generate remap suggestions for each broken reference
  if (report.brokenReferences.length > 0) {
    figma.ui.postMessage({
      type: 'scan-progress',
      message: `Found ${report.brokenReferences.length} broken references. Finding matches...`,
    });

    for (const brokenRef of report.brokenReferences) {
      const matches = await findMatchingVariables(brokenRef, allCollections);
      if (matches.length > 0) {
        report.remapSuggestions.push({
          brokenRef,
          matches,
        });
      }
    }
  }

  return report;
}

/**
 * Find matching variables for a broken reference
 */
async function findMatchingVariables(
  brokenRef: BrokenReference,
  collections: VariableCollection[]
): Promise<VariableMatch[]> {
  const matches: VariableMatch[] = [];

  // Determine what type of variable we're looking for based on property
  const propertyTypeMap: Record<string, VariableResolvedDataType> = {
    fills: 'COLOR',
    strokes: 'COLOR',
    backgroundColor: 'COLOR',
    cornerRadius: 'FLOAT',
    topLeftRadius: 'FLOAT',
    topRightRadius: 'FLOAT',
    bottomLeftRadius: 'FLOAT',
    bottomRightRadius: 'FLOAT',
    width: 'FLOAT',
    height: 'FLOAT',
    itemSpacing: 'FLOAT',
    paddingTop: 'FLOAT',
    paddingRight: 'FLOAT',
    paddingBottom: 'FLOAT',
    paddingLeft: 'FLOAT',
    strokeWeight: 'FLOAT',
    opacity: 'FLOAT',
    fontSize: 'FLOAT',
    lineHeight: 'FLOAT',
    letterSpacing: 'FLOAT',
    paragraphSpacing: 'FLOAT',
    fontFamily: 'STRING',
    fontWeight: 'FLOAT',
    layoutGrids: 'FLOAT',
    visible: 'BOOLEAN',
  };

  const targetType = propertyTypeMap[brokenRef.property] || 'FLOAT';

  // Search all collections for matching variables
  for (const collection of collections) {
    for (const varId of collection.variableIds) {
      try {
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (!variable || variable.resolvedType !== targetType) continue;

        // Calculate similarity score
        let similarity = 0;
        let reason = '';

        // Match by current value
        if (brokenRef.currentValue !== undefined) {
          const defaultMode = collection.modes[0];
          const varValue = variable.valuesByMode[defaultMode.modeId];
          
          // Resolve the actual value (handle aliases)
          const resolvedValue = await resolveVariableValue(varValue, variable.resolvedType);

          if (valuesMatch(brokenRef.currentValue, resolvedValue, variable.resolvedType)) {
            similarity += 50;
            reason = 'Value matches current state';
          }
        }

        // Prioritize semantic collections (bonus points)
        const collectionNameLower = collection.name.toLowerCase();
        if (collectionNameLower.includes('semantic') || collectionNameLower.includes('component')) {
          similarity += 15;
          reason += (reason ? ' + ' : '') + 'Semantic collection';
        }

        // Match by property context (e.g., "primary" for fills)
        const nodeNameLower = brokenRef.nodeName.toLowerCase();
        const varNameLower = variable.name.toLowerCase();
        
        if (varNameLower.includes(brokenRef.property.toLowerCase())) {
          similarity += 10;
          reason += (reason ? ' + ' : '') + 'Property name match';
        }

        // Match by node name context
        const nodeKeywords = extractKeywords(nodeNameLower);
        const varKeywords = extractKeywords(varNameLower);
        const commonKeywords = nodeKeywords.filter(k => varKeywords.includes(k));
        
        if (commonKeywords.length > 0) {
          similarity += Math.min(20, commonKeywords.length * 8);
          reason += (reason ? ' + ' : '') + `Common keywords: ${commonKeywords.join(', ')}`;
        }

        // Partial name matching
        const varNameParts = varNameLower.split('/');
        const lastPart = varNameParts[varNameParts.length - 1];
        if (nodeNameLower.includes(lastPart) || lastPart.includes(nodeNameLower)) {
          similarity += 5;
          reason += (reason ? ' + ' : '') + 'Name similarity';
        }

        if (similarity > 0) {
          // Capture additional info for display
          let aliasPath: string | undefined;
          let hexValue: string | undefined;
          
          // Check if this variable is an alias
          const defaultMode = collection.modes[0];
          const varValue = variable.valuesByMode[defaultMode.modeId];
          
          if (typeof varValue === 'object' && varValue !== null && 'type' in varValue && varValue.type === 'VARIABLE_ALIAS') {
            // This is an alias - get what it aliases to
            const aliasInfo = await getAliasPath(varValue as VariableAlias);
            if (aliasInfo) {
              aliasPath = aliasInfo.path;
              if (aliasInfo.hexValue) {
                hexValue = aliasInfo.hexValue;
              }
            }
          } else if (variable.resolvedType === 'COLOR' && typeof varValue === 'object' && 'r' in varValue) {
            // Direct color value
            hexValue = colorToHex(varValue as RGB | RGBA);
          }
          
          matches.push({
            variableId: variable.id,
            variableName: variable.name,
            collectionName: collection.name,
            collectionId: collection.id,
            similarity,
            reason: reason || 'Type match',
            aliasPath,
            hexValue,
          });
        }
      } catch (e) {
        console.error('Error checking variable:', e);
      }
    }
  }

  // Sort by similarity (highest first), then prefer semantic collections
  matches.sort((a, b) => {
    if (b.similarity !== a.similarity) {
      return b.similarity - a.similarity;
    }
    // If similarity is equal, prefer semantic/component collections
    const aIsSemantic = a.collectionName.toLowerCase().includes('semantic') || a.collectionName.toLowerCase().includes('component');
    const bIsSemantic = b.collectionName.toLowerCase().includes('semantic') || b.collectionName.toLowerCase().includes('component');
    if (bIsSemantic && !aIsSemantic) return 1;
    if (aIsSemantic && !bIsSemantic) return -1;
    return 0;
  });

  // Return top 5 matches
  return matches.slice(0, 5);
}

/**
 * Get the alias path and hex value for a variable alias
 */
async function getAliasPath(alias: VariableAlias): Promise<{ path: string; hexValue?: string } | null> {
  try {
    const aliasedVar = await figma.variables.getVariableByIdAsync(alias.id);
    if (!aliasedVar) return null;
    
    const collection = await figma.variables.getVariableCollectionByIdAsync(aliasedVar.variableCollectionId);
    if (!collection) return null;
    
    const path = `${collection.name}/${aliasedVar.name}`;
    
    // If it's a color, get the hex value
    let hexValue: string | undefined;
    if (aliasedVar.resolvedType === 'COLOR') {
      const modeId = Object.keys(aliasedVar.valuesByMode)[0];
      const value = aliasedVar.valuesByMode[modeId];
      
      // Resolve any nested aliases
      const resolvedValue = await resolveVariableValue(value, 'COLOR');
      if (typeof resolvedValue === 'object' && 'r' in resolvedValue) {
        hexValue = colorToHex(resolvedValue as RGB | RGBA);
      }
    }
    
    return { path, hexValue };
  } catch (e) {
    console.error('Error getting alias path:', e);
    return null;
  }
}

/**
 * Resolve variable value, following alias chains to get the actual value
 */
async function resolveVariableValue(
  value: VariableValue,
  expectedType: VariableResolvedDataType
): Promise<VariableValue> {
  // If it's an alias, resolve it
  if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasedVar = await figma.variables.getVariableByIdAsync((value as VariableAlias).id);
    if (aliasedVar) {
      // Get the value from the first mode
      const modeId = Object.keys(aliasedVar.valuesByMode)[0];
      const aliasedValue = aliasedVar.valuesByMode[modeId];
      // Recursively resolve in case of chained aliases
      return resolveVariableValue(aliasedValue, expectedType);
    }
  }
  // Return the value as-is if not an alias
  return value;
}

/**
 * Check if two values match based on type
 */
function valuesMatch(
  currentValue: string | number | RGB | RGBA,
  variableValue: VariableValue,
  type: VariableResolvedDataType
): boolean {
  if (type === 'COLOR') {
    if (typeof variableValue === 'object' && 'r' in variableValue) {
      if (typeof currentValue === 'object' && 'r' in currentValue) {
        const color1 = currentValue as RGB | RGBA;
        const color2 = variableValue as RGB | RGBA;
        return (
          Math.abs(color1.r - color2.r) < 0.01 &&
          Math.abs(color1.g - color2.g) < 0.01 &&
          Math.abs(color1.b - color2.b) < 0.01
        );
      }
    }
  } else if (type === 'FLOAT') {
    if (typeof currentValue === 'number' && typeof variableValue === 'number') {
      return Math.abs(currentValue - variableValue) < 0.01;
    }
  } else if (type === 'STRING') {
    return String(currentValue) === String(variableValue);
  } else if (type === 'BOOLEAN') {
    return Boolean(currentValue) === Boolean(variableValue);
  }
  return false;
}

/**
 * Extract keywords from a name for matching
 */
function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'with'].includes(word));
}

/**
 * Rebind a broken reference to a new variable
 */
export async function rebindVariable(
  nodeId: string,
  property: string,
  newVariableId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      return { success: false, error: 'Node not found' };
    }

    if (!('setBoundVariable' in node)) {
      return { success: false, error: 'Node does not support variable binding' };
    }

    const variable = await figma.variables.getVariableByIdAsync(newVariableId);
    if (!variable) {
      return { success: false, error: 'Variable not found' };
    }

    // Set the new binding
    const nodeWithBinding = node as unknown as { setBoundVariable: (prop: string, variable: Variable) => void };
    nodeWithBinding.setBoundVariable(property, variable);

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Batch rebind multiple broken references
 */
export async function batchRebind(
  rebinds: Array<{ nodeId: string; property: string; variableId: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rebind of rebinds) {
    const result = await rebindVariable(rebind.nodeId, rebind.property, rebind.variableId);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(`${rebind.nodeId}/${rebind.property}: ${result.error}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Find all nodes using a specific variable
 */
export async function findNodesUsingVariable(variableId: string): Promise<{
  nodes: Array<{ id: string; name: string; type: string; properties: string[] }>;
}> {
  const nodes: Array<{ id: string; name: string; type: string; properties: string[] }> = [];
  await figma.loadAllPagesAsync();
  const allNodes = figma.root.findAll();

  for (const node of allNodes) {
    if ('boundVariables' in node && node.boundVariables) {
      const boundVars = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;
      const properties: string[] = [];

      for (const [property, binding] of Object.entries(boundVars)) {
        if (!binding) continue;

        const bindings = Array.isArray(binding) ? binding : [binding];
        for (const varAlias of bindings) {
          if (varAlias && varAlias.id === variableId) {
            properties.push(property);
          }
        }
      }

      if (properties.length > 0) {
        nodes.push({
          id: node.id,
          name: node.name,
          type: node.type,
          properties,
        });
      }
    }
  }

  return { nodes };
}

/**
 * Auto-fix broken references using best matches
 */
export async function autoFixBrokenReferences(
  report: ReferenceReport,
  minSimilarity: number = 70
): Promise<{ fixed: number; skipped: number }> {
  let fixed = 0;
  let skipped = 0;

  for (const suggestion of report.remapSuggestions) {
    const bestMatch = suggestion.matches[0];
    
    if (bestMatch && bestMatch.similarity >= minSimilarity) {
      const result = await rebindVariable(
        suggestion.brokenRef.nodeId,
        suggestion.brokenRef.property,
        bestMatch.variableId
      );
      
      if (result.success) {
        fixed++;
        figma.ui.postMessage({
          type: 'autofix-progress',
          message: `Fixed ${suggestion.brokenRef.nodeName} → ${bestMatch.variableName}`,
        });
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  }

  return { fixed, skipped };
}
