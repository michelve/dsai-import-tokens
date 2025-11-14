/**
 * DSAI Import Tokens Plugin - Hex to Variables Mapping
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For use with DSAI design system only.
 */

import { colorToHex } from './utils';

export interface HexMapping {
  hex: string;
  variableId: string;
  variableName: string;
  nodeCount: number;
  nodeIds: string[];
}

interface NodeColorInfo {
  nodeId: string;
  hex: string;
  type: 'fill' | 'stroke' | 'text';
  fillIndex?: number;
  textStart?: number;
  textEnd?: number;
}

/**
 * Scan pages for hardcoded hex values that match existing variables
 */
export async function scanForHexValues(scope: 'current' | 'all'): Promise<{
  mappings: HexMapping[];
  modes: string[];
}> {
  try {
    // Get all color variables
    const allVariables = await figma.variables.getLocalVariablesAsync('COLOR');

    if (allVariables.length === 0) {
      throw new Error('No color variables found in this document');
    }

    // Get all available modes from the first collection
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const modes = collections.length > 0
      ? collections[0].modes.map(m => m.name)
      : ['Light'];

    // Build a map of hex values to variables (using Light mode by default)
    const hexToVariableMap = new Map<string, Variable>();

    for (const variable of allVariables) {
      // Get the Light mode or first available mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      const value = variable.valuesByMode[modeId];

      if (value && typeof value === 'object' && 'r' in value) {
        const hex = colorToHex(value as RGB | RGBA).toLowerCase();
        // Store first match only (could be enhanced to handle multiple variables with same color)
        if (!hexToVariableMap.has(hex)) {
          hexToVariableMap.set(hex, variable);
        }
      }
    }

    // Determine which pages to scan
    const pagesToScan = scope === 'all'
      ? figma.root.children.filter(child => child.type === 'PAGE') as PageNode[]
      : [figma.currentPage];

    // Track all nodes with hardcoded colors
    const nodeColorMap = new Map<string, NodeColorInfo[]>(); // hex -> nodes

    for (const page of pagesToScan) {
      await scanPageForColors(page, nodeColorMap);
    }

    // Build mappings from nodes that have matching variables
    const mappings: HexMapping[] = [];

    for (const [hex, nodes] of nodeColorMap.entries()) {
      const variable = hexToVariableMap.get(hex);

      if (variable) {
        mappings.push({
          hex: hex.toUpperCase(),
          variableId: variable.id,
          variableName: variable.name,
          nodeCount: nodes.length,
          nodeIds: nodes.map(n => n.nodeId)
        });
      }
    }

    return {
      mappings: mappings.sort((a, b) => b.nodeCount - a.nodeCount), // Sort by most used
      modes
    };

  } catch (error) {
    console.error('Error scanning for hex values:', error);
    throw error;
  }
}

/**
 * Scan a single page for hardcoded colors
 */
async function scanPageForColors(
  page: PageNode,
  nodeColorMap: Map<string, NodeColorInfo[]>
): Promise<void> {
  // Find all nodes that could have colors
  const nodes = page.findAll(node => {
    return 'fills' in node || 'strokes' in node || node.type === 'TEXT';
  });

  for (const node of nodes) {
    await processNodeColors(node, nodeColorMap);
  }
}

/**
 * Process colors for a single node
 */
async function processNodeColors(
  node: SceneNode,
  nodeColorMap: Map<string, NodeColorInfo[]>
): Promise<void> {
  // Check fills
  if ('fills' in node && node.fills && Array.isArray(node.fills)) {
    processFills(node, nodeColorMap);
  }

  // Check strokes
  // TODO: Refine logic for mapping colors for strokes
  if ('strokes' in node && node.strokes && Array.isArray(node.strokes)) {
    processStrokes(node, nodeColorMap);
  }

  // Check text colors
  // TODO: Refine logic for mapping colors for text
  if (node.type === 'TEXT') {
    await processTextColors(node as TextNode, nodeColorMap);
  }
}

/**
 * Process fills for a node
 */
function processFills(
  node: SceneNode & FillsMixin,
  nodeColorMap: Map<string, NodeColorInfo[]>
): void {
  for (let i = 0; i < node.fills.length; i++) {
    const fill = node.fills[i];

    // Only process SOLID fills that are NOT already bound to variables
    if (fill.type === 'SOLID' && !fill.boundVariables?.color) {
      const hex = colorToHex(fill.color).toLowerCase();

      addColorInfo(nodeColorMap, hex, {
        nodeId: node.id,
        hex,
        type: 'fill',
        fillIndex: i
      });
    }
  }
}

/**
 * Process strokes for a node
 */
function processStrokes(
  node: SceneNode & StrokesMixin,
  nodeColorMap: Map<string, NodeColorInfo[]>
): void {
  for (let i = 0; i < node.strokes.length; i++) {
    const stroke = node.strokes[i];

    // Only process SOLID strokes that are NOT already bound to variables
    if (stroke.type === 'SOLID' && !stroke.boundVariables?.color) {
      const hex = colorToHex(stroke.color).toLowerCase();

      addColorInfo(nodeColorMap, hex, {
        nodeId: node.id,
        hex,
        type: 'stroke',
        fillIndex: i
      });
    }
  }
}

/**
 * Process text colors for a text node
 */
async function processTextColors(
  node: TextNode,
  nodeColorMap: Map<string, NodeColorInfo[]>
): Promise<void> {
  try {
    await figma.loadFontAsync(node.fontName as FontName);

    const segments = node.getStyledTextSegments(['fills']);
    for (const segment of segments) {
      if (segment.fills && Array.isArray(segment.fills)) {
        processTextSegmentFills(node, segment, nodeColorMap);
      }
    }
  } catch (error) {
    console.warn(`Could not process text node ${node.id}:`, error);
  }
}

/**
 * Process fills for a text segment
 */
function processTextSegmentFills(
  node: TextNode,
  segment: StyledTextSegment,
  nodeColorMap: Map<string, NodeColorInfo[]>
): void {
  for (const fill of segment.fills!) {
    if (fill.type === 'SOLID' && !fill.boundVariables?.color) {
      const hex = colorToHex(fill.color).toLowerCase();

      addColorInfo(nodeColorMap, hex, {
        nodeId: node.id,
        hex,
        type: 'text',
        textStart: segment.start,
        textEnd: segment.end
      });
    }
  }
}

/**
 * Helper to add color info to map
 */
function addColorInfo(
  nodeColorMap: Map<string, NodeColorInfo[]>,
  hex: string,
  info: NodeColorInfo
): void {
  if (!nodeColorMap.has(hex)) {
    nodeColorMap.set(hex, []);
  }
  nodeColorMap.get(hex)!.push(info);
}

/**
 * Apply selected mappings to nodes
 */
export async function applyHexMappings(
  mappings: HexMapping[],
  mode: string
): Promise<{ appliedCount: number; errorCount: number }> {
  let appliedCount = 0;
  let errorCount = 0;

  // Get all variables for lookups
  const allVariables = await figma.variables.getLocalVariablesAsync('COLOR');

  for (const mapping of mappings) {
    // Find the variable
    const variable = allVariables.find(v => v.id === mapping.variableId);

    if (!variable) {
      console.error(`Variable not found: ${mapping.variableId}`);
      errorCount += mapping.nodeCount;
      continue;
    }

    // Process each node
    for (const nodeId of mapping.nodeIds) {
      const node = await figma.getNodeByIdAsync(nodeId);

      if (!node) {
        console.warn(`Node not found: ${nodeId}`);
        errorCount++;
        continue;
      }

      try {
        // Apply mapping based on node type
        if ('fills' in node && node.fills && Array.isArray(node.fills)) {
          await applyFillMapping(node, variable, mapping.hex.toLowerCase());
          appliedCount++;
        } else if (node.type === 'TEXT') {
          await applyTextMapping(node as TextNode, variable, mapping.hex.toLowerCase());
          appliedCount++;
        }

        // Also check strokes
        if ('strokes' in node && node.strokes && Array.isArray(node.strokes)) {
          await applyStrokeMapping(node, variable, mapping.hex.toLowerCase());
        }
      } catch (error) {
        console.error(`Error applying mapping to node ${nodeId}:`, error);
        errorCount++;
      }
    }
  }

  return { appliedCount, errorCount };
}

/**
 * Apply variable binding to fills
 */
async function applyFillMapping(
  node: SceneNode & FillsMixin,
  variable: Variable,
  targetHex: string
): Promise<void> {
  const fills = [...node.fills];
  let hasChanges = false;

  for (let i = 0; i < fills.length; i++) {
    const fill = fills[i];

    if (fill.type === 'SOLID' && !fill.boundVariables?.color) {
      const fillHex = colorToHex(fill.color).toLowerCase();

      if (fillHex === targetHex) {
        // Bind the variable to this fill
        fills[i] = figma.variables.setBoundVariableForPaint(
          fills[i],
          'color',
          variable
        );
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    node.fills = fills;
  }
}

/**
 * Apply variable binding to strokes
 */
async function applyStrokeMapping(
  node: SceneNode & StrokesMixin,
  variable: Variable,
  targetHex: string
): Promise<void> {
  const strokes = [...node.strokes];
  let hasChanges = false;

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];

    if (stroke.type === 'SOLID' && !stroke.boundVariables?.color) {
      const strokeHex = colorToHex(stroke.color).toLowerCase();

      if (strokeHex === targetHex) {
        // Bind the variable to this stroke
        strokes[i] = figma.variables.setBoundVariableForPaint(
          strokes[i],
          'color',
          variable
        );
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    node.strokes = strokes;
  }
}

/**
 * Apply variable binding to text fills
 */
async function applyTextMapping(
  node: TextNode,
  variable: Variable,
  targetHex: string
): Promise<void> {
  try {
    // Load font before modifying text
    await figma.loadFontAsync(node.fontName as FontName);

    const segments = node.getStyledTextSegments(['fills']);

    for (const segment of segments) {
      if (segment.fills && Array.isArray(segment.fills)) {
        const fills = [...segment.fills];
        let hasChanges = false;

        for (let i = 0; i < fills.length; i++) {
          const fill = fills[i];

          if (fill.type === 'SOLID' && !fill.boundVariables?.color) {
            const fillHex = colorToHex(fill.color).toLowerCase();

            if (fillHex === targetHex) {
              // Bind the variable to this fill
              fills[i] = figma.variables.setBoundVariableForPaint(
                fills[i],
                'color',
                variable
              );
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          node.setRangeFills(segment.start, segment.end, fills);
        }
      }
    }
  } catch (error) {
    console.warn(`Could not apply text mapping to node ${node.id}:`, error);
    throw error;
  }
}

// TODO: Enhancement - Add fuzzy matching for hex values that don't exactly match
// This would find the closest variable color for hex values that are slightly different
// Implementation could use color distance algorithms (e.g., Delta E)

