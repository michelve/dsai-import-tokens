/**
 * DSAI Import Tokens Plugin - Scope Mapping
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For use with DSAI design system only.
 */

export interface PropertyMapping {
  propertyType: PropertyType;
  currentValue: string | number;
  variableId: string;
  variableName: string;
  variableOptions: VariableOption[];
  nodeCount: number;
  nodeIds: string[];
}

export interface VariableOption {
  id: string;
  name: string;
  value: string | number;
  isAlias: boolean;
  aliasTo?: string;
  scopes: VariableScope[];
}

export type PropertyType =
  | 'cornerRadius'
  | 'topLeftRadius'
  | 'topRightRadius'
  | 'bottomLeftRadius'
  | 'bottomRightRadius'
  | 'itemSpacing'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'strokeWeight'
  | 'opacity'
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'paragraphSpacing'
  | 'fontFamily'
  | 'fontWeight';

interface NodePropertyInfo {
  nodeId: string;
  propertyType: PropertyType;
  currentValue: string | number;
}

/**
 * Map property types to their required Figma variable scopes
 */
function getRequiredScopesForProperty(propertyType: PropertyType): VariableScope[] {
  const scopeMap: Record<PropertyType, VariableScope[]> = {
    // Corner radius properties require CORNER_RADIUS scope
    cornerRadius: ['CORNER_RADIUS', 'ALL_SCOPES'],
    topLeftRadius: ['CORNER_RADIUS', 'ALL_SCOPES'],
    topRightRadius: ['CORNER_RADIUS', 'ALL_SCOPES'],
    bottomLeftRadius: ['CORNER_RADIUS', 'ALL_SCOPES'],
    bottomRightRadius: ['CORNER_RADIUS', 'ALL_SCOPES'],

    // Auto layout spacing requires GAP scope
    itemSpacing: ['GAP', 'ALL_SCOPES'],

    // Padding properties should primarily use GAP scope (not WIDTH_HEIGHT)
    // WIDTH_HEIGHT is for element dimensions, GAP is for spacing/padding
    paddingTop: ['GAP', 'ALL_SCOPES'],
    paddingRight: ['GAP', 'ALL_SCOPES'],
    paddingBottom: ['GAP', 'ALL_SCOPES'],
    paddingLeft: ['GAP', 'ALL_SCOPES'],

    // Stroke weight requires STROKE_FLOAT scope
    strokeWeight: ['STROKE_FLOAT', 'ALL_SCOPES'],

    // Opacity requires OPACITY scope
    opacity: ['OPACITY', 'ALL_SCOPES'],

    // Typography properties require their specific scopes
    fontSize: ['FONT_SIZE', 'ALL_SCOPES'],
    lineHeight: ['LINE_HEIGHT', 'ALL_SCOPES'],
    letterSpacing: ['LETTER_SPACING', 'ALL_SCOPES'],
    paragraphSpacing: ['PARAGRAPH_SPACING', 'ALL_SCOPES'],
    fontFamily: ['FONT_FAMILY', 'ALL_SCOPES'],
    fontWeight: ['FONT_WEIGHT', 'ALL_SCOPES']
  };

  return scopeMap[propertyType] || ['ALL_SCOPES'];
}

/**
 * Check if a variable has at least one of the required scopes
 */
function hasCompatibleScope(variableScopes: VariableScope[], requiredScopes: VariableScope[]): boolean {
  return requiredScopes.some(reqScope => variableScopes.includes(reqScope));
}

/**
 * Scan for hardcoded property values that match existing variables
 */
export async function scanForProperties(scope: 'current' | 'all' | 'selection'): Promise<{
  mappings: PropertyMapping[];
  propertyTypes: PropertyType[];
}> {
  try {
    // Get all variables
    const allVariables = await figma.variables.getLocalVariablesAsync();

    if (allVariables.length === 0) {
      throw new Error('No variables found in this document');
    }

    // Filter for FLOAT and STRING variables
    const numberVariables = allVariables.filter(v => v.resolvedType === 'FLOAT');
    const stringVariables = allVariables.filter(v => v.resolvedType === 'STRING');

    // Build maps: value -> variables
    const numberValueMap = new Map<number, VariableOption[]>();
    const stringValueMap = new Map<string, VariableOption[]>();

    // Process number variables
    for (const variable of numberVariables) {
      const modeId = Object.keys(variable.valuesByMode)[0];
      const value = variable.valuesByMode[modeId];

      if (typeof value === 'number') {
        if (!numberValueMap.has(value)) {
          numberValueMap.set(value, []);
        }

        numberValueMap.get(value)!.push({
          id: variable.id,
          name: variable.name,
          value: value,
          isAlias: false,
          scopes: variable.scopes
        });
      }

      // Check for aliases
      if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        const aliasedVar = allVariables.find(v => v.id === (value as VariableAlias).id);

        if (aliasedVar) {
          const aliasedModeId = Object.keys(aliasedVar.valuesByMode)[0];
          const aliasedValue = aliasedVar.valuesByMode[aliasedModeId];

          if (typeof aliasedValue === 'number') {
            if (!numberValueMap.has(aliasedValue)) {
              numberValueMap.set(aliasedValue, []);
            }

            numberValueMap.get(aliasedValue)!.push({
              id: variable.id,
              name: variable.name,
              value: aliasedValue,
              isAlias: true,
              aliasTo: aliasedVar.name,
              scopes: variable.scopes
            });
          }
        }
      }
    }

    // Process string variables (for font families, font weights)
    for (const variable of stringVariables) {
      const modeId = Object.keys(variable.valuesByMode)[0];
      const value = variable.valuesByMode[modeId];

      if (typeof value === 'string') {
        if (!stringValueMap.has(value)) {
          stringValueMap.set(value, []);
        }

        stringValueMap.get(value)!.push({
          id: variable.id,
          name: variable.name,
          value: value,
          isAlias: false,
          scopes: variable.scopes
        });
      }

      // Check for aliases
      if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        const aliasedVar = allVariables.find(v => v.id === (value as VariableAlias).id);

        if (aliasedVar) {
          const aliasedModeId = Object.keys(aliasedVar.valuesByMode)[0];
          const aliasedValue = aliasedVar.valuesByMode[aliasedModeId];

          if (typeof aliasedValue === 'string') {
            if (!stringValueMap.has(aliasedValue)) {
              stringValueMap.set(aliasedValue, []);
            }

            stringValueMap.get(aliasedValue)!.push({
              id: variable.id,
              name: variable.name,
              value: aliasedValue,
              isAlias: true,
              aliasTo: aliasedVar.name,
              scopes: variable.scopes
            });
          }
        }
      }
    }

    // Track all nodes with properties
    const nodePropertyMap = new Map<string, NodePropertyInfo[]>(); // key: "propertyType:value" -> nodes

    // Determine what to scan based on scope
    if (scope === 'selection') {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        throw new Error('No nodes selected. Please select frames, groups, or layers to scan.');
      }

      for (const node of selection) {
        await scanNodeAndChildren(node, nodePropertyMap);
      }
    } else {
      const pagesToScan = scope === 'all'
        ? figma.root.children.filter(child => child.type === 'PAGE') as PageNode[]
        : [figma.currentPage];

      for (const page of pagesToScan) {
        await scanPageForProperties(page, nodePropertyMap);
      }
    }

    // Build mappings from properties that have matching variables
    const mappings: PropertyMapping[] = [];
    const propertyTypes = new Set<PropertyType>();

    for (const [key, nodes] of nodePropertyMap.entries()) {
      const [propertyType, valueStr] = key.split(':');
      const value = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
      const propType = propertyType as PropertyType;

      // Get required scopes for this property type
      const requiredScopes = getRequiredScopesForProperty(propType);

      let variableOptions: VariableOption[] | undefined;

      if (typeof value === 'number') {
        variableOptions = numberValueMap.get(value);
      } else {
        variableOptions = stringValueMap.get(value);
      }

      if (variableOptions && variableOptions.length > 0) {
        // Filter variables to only those with compatible scopes
        const compatibleVariables = variableOptions.filter(option =>
          hasCompatibleScope(option.scopes, requiredScopes)
        );

        if (compatibleVariables.length === 0) {
          // No compatible variables found for this property
          console.warn(
            `Property ${propertyType} with value ${value} has ${variableOptions.length} variable(s) with matching value, ` +
            `but none have compatible scopes. Required: ${requiredScopes.join(', ')}. ` +
            `Available: ${variableOptions.map(v => `${v.name} (${v.scopes.join(', ')})`).join('; ')}`
          );
          continue;
        }

        // Sort options: primitives first, then aliases
        const sortedOptions = [...compatibleVariables].sort((a, b) => {
          if (a.isAlias === b.isAlias) return 0;
          return a.isAlias ? 1 : -1;
        });

        const defaultOption = sortedOptions[0];

        mappings.push({
          propertyType: propType,
          currentValue: value,
          variableId: defaultOption.id,
          variableName: defaultOption.name,
          variableOptions: sortedOptions,
          nodeCount: nodes.length,
          nodeIds: nodes.map(n => n.nodeId)
        });

        propertyTypes.add(propType);
      }
    }

    return {
      mappings: mappings.sort((a, b) => b.nodeCount - a.nodeCount),
      propertyTypes: Array.from(propertyTypes)
    };

  } catch (error) {
    console.error('Error scanning for properties:', error);
    throw error;
  }
}

/**
 * Scan a page for properties
 */
async function scanPageForProperties(
  page: PageNode,
  nodePropertyMap: Map<string, NodePropertyInfo[]>
): Promise<void> {
  const nodes = page.findAll(node => {
    return (
      'cornerRadius' in node ||
      'itemSpacing' in node ||
      'paddingLeft' in node ||
      'strokeWeight' in node ||
      'opacity' in node ||
      node.type === 'TEXT'
    );
  });

  for (const node of nodes) {
    await processNodeProperties(node, nodePropertyMap);
  }
}

/**
 * Scan a node and its children for properties
 */
async function scanNodeAndChildren(
  node: SceneNode,
  nodePropertyMap: Map<string, NodePropertyInfo[]>
): Promise<void> {
  await processNodeProperties(node, nodePropertyMap);

  if ('children' in node) {
    const children = (node as ChildrenMixin).children;

    for (const child of children) {
      const descendants = child.findAll(descendant => {
        return (
          'cornerRadius' in descendant ||
          'itemSpacing' in descendant ||
          'paddingLeft' in descendant ||
          'strokeWeight' in descendant ||
          'opacity' in descendant ||
          descendant.type === 'TEXT'
        );
      });

      await processNodeProperties(child, nodePropertyMap);

      for (const descendant of descendants) {
        await processNodeProperties(descendant, nodePropertyMap);
      }
    }
  }
}

/**
 * Process properties for a single node
 */
async function processNodeProperties(
  node: SceneNode,
  nodePropertyMap: Map<string, NodePropertyInfo[]>
): Promise<void> {
  // Border radius properties
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && !node.boundVariables?.cornerRadius) {
    addPropertyInfo(nodePropertyMap, 'cornerRadius', node.cornerRadius, node.id);
  }

  if ('topLeftRadius' in node && typeof node.topLeftRadius === 'number' && !node.boundVariables?.topLeftRadius) {
    addPropertyInfo(nodePropertyMap, 'topLeftRadius', node.topLeftRadius, node.id);
  }

  if ('topRightRadius' in node && typeof node.topRightRadius === 'number' && !node.boundVariables?.topRightRadius) {
    addPropertyInfo(nodePropertyMap, 'topRightRadius', node.topRightRadius, node.id);
  }

  if ('bottomLeftRadius' in node && typeof node.bottomLeftRadius === 'number' && !node.boundVariables?.bottomLeftRadius) {
    addPropertyInfo(nodePropertyMap, 'bottomLeftRadius', node.bottomLeftRadius, node.id);
  }

  if ('bottomRightRadius' in node && typeof node.bottomRightRadius === 'number' && !node.boundVariables?.bottomRightRadius) {
    addPropertyInfo(nodePropertyMap, 'bottomRightRadius', node.bottomRightRadius, node.id);
  }

  // Auto layout spacing
  if ('itemSpacing' in node && typeof node.itemSpacing === 'number' && !node.boundVariables?.itemSpacing) {
    addPropertyInfo(nodePropertyMap, 'itemSpacing', node.itemSpacing, node.id);
  }

  // Padding properties
  if ('paddingTop' in node && typeof node.paddingTop === 'number' && !node.boundVariables?.paddingTop) {
    addPropertyInfo(nodePropertyMap, 'paddingTop', node.paddingTop, node.id);
  }

  if ('paddingRight' in node && typeof node.paddingRight === 'number' && !node.boundVariables?.paddingRight) {
    addPropertyInfo(nodePropertyMap, 'paddingRight', node.paddingRight, node.id);
  }

  if ('paddingBottom' in node && typeof node.paddingBottom === 'number' && !node.boundVariables?.paddingBottom) {
    addPropertyInfo(nodePropertyMap, 'paddingBottom', node.paddingBottom, node.id);
  }

  if ('paddingLeft' in node && typeof node.paddingLeft === 'number' && !node.boundVariables?.paddingLeft) {
    addPropertyInfo(nodePropertyMap, 'paddingLeft', node.paddingLeft, node.id);
  }

  // Stroke weight
  if ('strokeWeight' in node && typeof node.strokeWeight === 'number' && !node.boundVariables?.strokeWeight) {
    addPropertyInfo(nodePropertyMap, 'strokeWeight', node.strokeWeight, node.id);
  }

  // Opacity (0-1 range in Figma, but variables are typically stored as 0-100)
  if ('opacity' in node && typeof node.opacity === 'number' && !node.boundVariables?.opacity) {
    // Convert Figma's 0-1 opacity to percentage (0-100) to match variable values
    const opacityPercent = Math.round(node.opacity * 100);
    addPropertyInfo(nodePropertyMap, 'opacity', opacityPercent, node.id);
  }

  // Text properties
  if (node.type === 'TEXT') {
    await processTextProperties(node as TextNode, nodePropertyMap);
  }
}

/**
 * Process text-specific properties
 */
async function processTextProperties(
  node: TextNode,
  nodePropertyMap: Map<string, NodePropertyInfo[]>
): Promise<void> {
  try {
    // Font size
    if (typeof node.fontSize === 'number' && !node.boundVariables?.fontSize) {
      addPropertyInfo(nodePropertyMap, 'fontSize', node.fontSize, node.id);
    }

    // Line height (convert to number if it's an object with value)
    if (node.lineHeight && typeof node.lineHeight === 'object' && 'value' in node.lineHeight) {
      const lineHeightValue = node.lineHeight.value;
      if (typeof lineHeightValue === 'number' && !node.boundVariables?.lineHeight) {
        addPropertyInfo(nodePropertyMap, 'lineHeight', lineHeightValue, node.id);
      }
    }

    // Letter spacing
    if (typeof node.letterSpacing === 'object' && 'value' in node.letterSpacing) {
      const letterSpacingValue = node.letterSpacing.value;
      if (typeof letterSpacingValue === 'number' && !node.boundVariables?.letterSpacing) {
        addPropertyInfo(nodePropertyMap, 'letterSpacing', letterSpacingValue, node.id);
      }
    }

    // Paragraph spacing
    if (typeof node.paragraphSpacing === 'number' && !node.boundVariables?.paragraphSpacing) {
      addPropertyInfo(nodePropertyMap, 'paragraphSpacing', node.paragraphSpacing, node.id);
    }

    // Font family
    if (node.fontName !== figma.mixed && typeof node.fontName === 'object' && !node.boundVariables?.fontFamily) {
      const fontFamily = node.fontName.family;
      addPropertyInfo(nodePropertyMap, 'fontFamily', fontFamily, node.id);
    }

    // Font weight
    if (node.fontName !== figma.mixed && typeof node.fontName === 'object' && !node.boundVariables?.fontWeight) {
      const fontWeight = node.fontName.style;
      // Map font style to weight number if possible
      const weightMap: Record<string, number> = {
        'Thin': 100,
        'Extra Light': 200,
        'Light': 300,
        'Regular': 400,
        'Medium': 500,
        'Semi Bold': 600,
        'Bold': 700,
        'Extra Bold': 800,
        'Black': 900
      };

      const numericWeight = weightMap[fontWeight];
      if (numericWeight) {
        addPropertyInfo(nodePropertyMap, 'fontWeight', numericWeight, node.id);
      }
    }

  } catch (error) {
    console.warn(`Could not process text properties for node ${node.id}:`, error);
  }
}

/**
 * Helper to add property info to map
 */
function addPropertyInfo(
  nodePropertyMap: Map<string, NodePropertyInfo[]>,
  propertyType: PropertyType,
  value: string | number,
  nodeId: string
): void {
  const key = `${propertyType}:${value}`;

  if (!nodePropertyMap.has(key)) {
    nodePropertyMap.set(key, []);
  }

  nodePropertyMap.get(key)!.push({
    nodeId,
    propertyType,
    currentValue: value
  });
}

/**
 * Apply selected property mappings to nodes
 */
export async function applyPropertyMappings(
  mappings: PropertyMapping[]
): Promise<{ appliedCount: number; errorCount: number }> {
  let appliedCount = 0;
  let errorCount = 0;

  const allVariables = await figma.variables.getLocalVariablesAsync();

  for (const mapping of mappings) {
    const variable = allVariables.find(v => v.id === mapping.variableId);

    if (!variable) {
      console.error(`Variable not found: ${mapping.variableId}`);
      errorCount += mapping.nodeCount;
      continue;
    }

    for (const nodeId of mapping.nodeIds) {
      const node = await figma.getNodeByIdAsync(nodeId);

      if (!node) {
        console.warn(`Node not found: ${nodeId}`);
        errorCount++;
        continue;
      }

      try {
        await applyPropertyBinding(node, mapping.propertyType, variable, mapping.currentValue);
        appliedCount++;
      } catch (error) {
        console.error(`Error applying mapping to node ${nodeId}:`, error);
        errorCount++;
      }
    }
  }

  return { appliedCount, errorCount };
}

/**
 * Apply variable binding to a specific property
 */
async function applyPropertyBinding(
  node: SceneNode,
  propertyType: PropertyType,
  variable: Variable,
  currentValue: string | number
): Promise<void> {
  // Debug logging for padding properties
  if (propertyType.includes('padding')) {
    console.log(`Attempting to bind ${propertyType}:`, {
      nodeId: node.id,
      nodeType: node.type,
      currentValue,
      actualNodeValue: propertyType in node ? (node as any)[propertyType] : 'property not found',
      variableName: variable.name,
      variableId: variable.id
    });
  }

  // Verify the node has the property and it matches the expected value
  switch (propertyType) {
    case 'cornerRadius':
      if ('cornerRadius' in node && node.cornerRadius === currentValue) {
        node.setBoundVariable('cornerRadius', variable);
      }
      break;

    case 'topLeftRadius':
      if ('topLeftRadius' in node && node.topLeftRadius === currentValue) {
        node.setBoundVariable('topLeftRadius', variable);
      }
      break;

    case 'topRightRadius':
      if ('topRightRadius' in node && node.topRightRadius === currentValue) {
        node.setBoundVariable('topRightRadius', variable);
      }
      break;

    case 'bottomLeftRadius':
      if ('bottomLeftRadius' in node && node.bottomLeftRadius === currentValue) {
        node.setBoundVariable('bottomLeftRadius', variable);
      }
      break;

    case 'bottomRightRadius':
      if ('bottomRightRadius' in node && node.bottomRightRadius === currentValue) {
        node.setBoundVariable('bottomRightRadius', variable);
      }
      break;

    case 'itemSpacing':
      if ('itemSpacing' in node && node.itemSpacing === currentValue) {
        node.setBoundVariable('itemSpacing', variable);
      }
      break;

    case 'paddingTop':
      if ('paddingTop' in node && node.paddingTop === currentValue) {
        try {
          node.setBoundVariable('paddingTop', variable);
        } catch (error) {
          console.error(`Failed to bind paddingTop: ${error}`, { nodeType: node.type, hasAutoLayout: 'layoutMode' in node });
          throw error;
        }
      }
      break;

    case 'paddingRight':
      if ('paddingRight' in node && node.paddingRight === currentValue) {
        try {
          node.setBoundVariable('paddingRight', variable);
        } catch (error) {
          console.error(`Failed to bind paddingRight: ${error}`, { nodeType: node.type, hasAutoLayout: 'layoutMode' in node });
          throw error;
        }
      }
      break;

    case 'paddingBottom':
      if ('paddingBottom' in node && node.paddingBottom === currentValue) {
        try {
          node.setBoundVariable('paddingBottom', variable);
        } catch (error) {
          console.error(`Failed to bind paddingBottom: ${error}`, { nodeType: node.type, hasAutoLayout: 'layoutMode' in node });
          throw error;
        }
      }
      break;

    case 'paddingLeft':
      if ('paddingLeft' in node && node.paddingLeft === currentValue) {
        try {
          node.setBoundVariable('paddingLeft', variable);
        } catch (error) {
          console.error(`Failed to bind paddingLeft: ${error}`, { nodeType: node.type, hasAutoLayout: 'layoutMode' in node });
          throw error;
        }
      }
      break;

    case 'strokeWeight':
      if ('strokeWeight' in node && node.strokeWeight === currentValue) {
        node.setBoundVariable('strokeWeight', variable);
      }
      break;

    case 'opacity':
      if ('opacity' in node) {
        // currentValue is percentage (0-100), node.opacity is Figma's 0-1 range
        const nodeOpacityPercent = Math.round(node.opacity * 100);
        if (nodeOpacityPercent === currentValue) {
          node.setBoundVariable('opacity', variable);
        }
      }
      break;

    case 'fontSize':
      if (node.type === 'TEXT' && node.fontSize === currentValue) {
        node.setBoundVariable('fontSize', variable);
      }
      break;

    case 'lineHeight':
      if (node.type === 'TEXT' && node.lineHeight && typeof node.lineHeight === 'object' && 'value' in node.lineHeight && node.lineHeight.value === currentValue) {
        node.setBoundVariable('lineHeight', variable);
      }
      break;

    case 'letterSpacing':
      if (node.type === 'TEXT' && node.letterSpacing && typeof node.letterSpacing === 'object' && 'value' in node.letterSpacing && node.letterSpacing.value === currentValue) {
        node.setBoundVariable('letterSpacing', variable);
      }
      break;

    case 'paragraphSpacing':
      if (node.type === 'TEXT' && node.paragraphSpacing === currentValue) {
        node.setBoundVariable('paragraphSpacing', variable);
      }
      break;

    case 'fontFamily':
      if (node.type === 'TEXT' && node.fontName !== figma.mixed && typeof node.fontName === 'object' && node.fontName.family === currentValue) {
        node.setBoundVariable('fontFamily', variable);
      }
      break;

    case 'fontWeight':
      if (node.type === 'TEXT' && node.fontName !== figma.mixed) {
        node.setBoundVariable('fontWeight', variable);
      }
      break;

    default:
      throw new Error(`Unknown property type: ${propertyType}`);
  }
}

