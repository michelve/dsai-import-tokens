/**
 * DSAI Import Tokens Plugin - Utility Functions
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Utility functions for token operations

export function isAlias(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    value.toString().trim().charAt(0) === "{"
  );
}

export function parseColor(colorString: string): RGB | RGBA {
  // Remove whitespace
  colorString = colorString.trim();

  // Handle hex colors
  if (colorString.startsWith("#")) {
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
  if (colorString.startsWith("rgba")) {
    const match = colorString.match(/rgba?\(([^)]+)\)/);
    if (match && match[1]) {
      const values = match[1].split(",").map((v) => parseFloat(v.trim()));
      return {
        r: values[0] / 255,
        g: values[1] / 255,
        b: values[2] / 255,
        a: values[3] !== undefined ? values[3] : 1,
      };
    }
  }

  // Handle rgb colors
  if (colorString.startsWith("rgb")) {
    const match = colorString.match(/rgb\(([^)]+)\)/);
    if (match && match[1]) {
      const values = match[1].split(",").map((v) => parseFloat(v.trim()));
      return {
        r: values[0] / 255,
        g: values[1] / 255,
        b: values[2] / 255,
        a: 1,
      };
    }
  }

  // Default fallback
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function mapScopes(scopes: string[]): VariableScope[] {
  // Map our scope names to Figma's VariableScope enum
  // Official Figma VariableScope values from plugin-api.d.ts
  const scopeMap: Record<string, VariableScope[]> = {
    // General
    ALL_SCOPES: ["ALL_SCOPES"],

    // Color/Fill Scopes
    ALL_FILLS: ["ALL_FILLS"],
    FRAME_FILL: ["FRAME_FILL"],
    SHAPE_FILL: ["SHAPE_FILL"],
    TEXT_FILL: ["TEXT_FILL"],

    // Stroke Scopes
    STROKE: ["STROKE_COLOR"], // Alias for backward compatibility
    STROKE_COLOR: ["STROKE_COLOR"],
    STROKE_FLOAT: ["STROKE_FLOAT"],

    // Effect Scopes
    EFFECT_COLOR: ["EFFECT_COLOR"],
    EFFECT_FLOAT: ["EFFECT_FLOAT"],

    // Layout/Geometry Scopes
    TEXT_CONTENT: ["TEXT_CONTENT"],
    CORNER_RADIUS: ["CORNER_RADIUS"],
    WIDTH_HEIGHT: ["WIDTH_HEIGHT"],
    GAP: ["GAP"],
    OPACITY: ["OPACITY"],

    // Typography Scopes
    FONT_FAMILY: ["FONT_FAMILY"],
    FONT_STYLE: ["FONT_STYLE"],
    FONT_WEIGHT: ["FONT_WEIGHT"],
    FONT_SIZE: ["FONT_SIZE"],
    LINE_HEIGHT: ["LINE_HEIGHT"],
    LETTER_SPACING: ["LETTER_SPACING"],
    PARAGRAPH_SPACING: ["PARAGRAPH_SPACING"],
    PARAGRAPH_INDENT: ["PARAGRAPH_INDENT"],
  };

  const figmaScopes: VariableScope[] = [];

  for (const scope of scopes) {
    const mapped = scopeMap[scope];
    if (mapped) {
      figmaScopes.push(...mapped);
    } else {
      // Log warning for unmapped scopes
      console.warn(
        `Unknown scope: ${scope}. Using as-is. Valid scopes are: ${Object.keys(
          scopeMap
        ).join(", ")}`
      );
      // Try to use it directly in case it's already a valid Figma scope
      figmaScopes.push(scope as VariableScope);
    }
  }

  return figmaScopes.length > 0 ? figmaScopes : ["ALL_SCOPES"];
}

export function colorToHex(color: RGB | RGBA): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function resolveAliasPath(
  variableId: string,
  allVariables: Variable[]
): string | null {
  const variable = allVariables.find((v: Variable) => v.id === variableId);
  if (!variable) return null;

  // Convert variable name to token path format
  return `{${variable.name.replace(/\//g, ".")}}`;
}
