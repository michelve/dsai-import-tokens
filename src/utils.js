/**
 * DSAI Import Tokens Plugin - Utility Functions
 * Copyright (c) 2025. All rights reserved.
 * 
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Utility functions for token operations

export function isAlias(value) {
  return value && value.toString().trim().charAt(0) === '{';
}

export function parseColor(colorString) {
  // Remove whitespace
  colorString = colorString.trim();

  // Handle hex colors
  if (colorString.startsWith('#')) {
    const hex = colorString.substring(1);

    // Support both #RGB and #RRGGBB
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    }

    return { r, g, b, a: 1 };
  }

  // Handle rgba colors
  if (colorString.startsWith('rgba')) {
    const values = colorString
      .match(/rgba?\(([^)]+)\)/)[1]
      .split(',')
      .map((v) => parseFloat(v.trim()));
    return {
      r: values[0] / 255,
      g: values[1] / 255,
      b: values[2] / 255,
      a: values[3] !== undefined ? values[3] : 1,
    };
  }

  // Handle rgb colors
  if (colorString.startsWith('rgb')) {
    const values = colorString
      .match(/rgb\(([^)]+)\)/)[1]
      .split(',')
      .map((v) => parseFloat(v.trim()));
    return {
      r: values[0] / 255,
      g: values[1] / 255,
      b: values[2] / 255,
      a: 1,
    };
  }

  // Default fallback
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function mapScopes(scopes) {
  // Map our scope names to Figma's VariableScope enum
  const scopeMap = {
    ALL_SCOPES: ['ALL_SCOPES'],
    ALL_FILLS: ['ALL_FILLS'],
    FRAME_FILL: ['FRAME_FILL'],
    SHAPE_FILL: ['SHAPE_FILL'],
    TEXT_FILL: ['TEXT_FILL'],
    STROKE: ['STROKE_COLOR'],
    STROKE_COLOR: ['STROKE_COLOR'],
    EFFECT_COLOR: ['EFFECT_COLOR'],
  };

  const figmaScopes = [];

  for (const scope of scopes) {
    const mapped = scopeMap[scope];
    if (mapped) {
      figmaScopes.push(...mapped);
    }
  }

  return figmaScopes.length > 0 ? figmaScopes : ['ALL_SCOPES'];
}

export function colorToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function resolveAliasPath(variableId, allVariables) {
  const variable = allVariables.find(v => v.id === variableId);
  if (!variable) return null;
  
  // Convert variable name to token path format
  return `{${variable.name.replace(/\//g, '.')}}`;
}
