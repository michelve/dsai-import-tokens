/**
 * DSAI Import Tokens Plugin - Variable Preferences
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For use with DSAI design system only.
 */

import type { PropertyType } from "./scopeMapping";

export interface VariablePreference {
  propertyType: PropertyType;
  preferredPatterns: string[]; // Patterns to prefer, in priority order
  excludedPatterns: string[]; // Patterns to avoid
}

export interface VariablePreferences {
  version: number;
  preferences: VariablePreference[];
}

const STORAGE_KEY = "dsai-variable-preferences";
const CURRENT_VERSION = 1;

/**
 * Default preferences based on common design system patterns
 */
const DEFAULT_PREFERENCES: VariablePreferences = {
  version: CURRENT_VERSION,
  preferences: [
    {
      propertyType: "paddingTop",
      preferredPatterns: ["spacing/", "space/", "padding/"],
      excludedPatterns: ["gutter/", "gap/"],
    },
    {
      propertyType: "paddingRight",
      preferredPatterns: ["spacing/", "space/", "padding/"],
      excludedPatterns: ["gutter/", "gap/"],
    },
    {
      propertyType: "paddingBottom",
      preferredPatterns: ["spacing/", "space/", "padding/"],
      excludedPatterns: ["gutter/", "gap/"],
    },
    {
      propertyType: "paddingLeft",
      preferredPatterns: ["spacing/", "space/", "padding/"],
      excludedPatterns: ["gutter/", "gap/"],
    },
    {
      propertyType: "itemSpacing",
      preferredPatterns: ["gap/", "spacing/", "gutter/"],
      excludedPatterns: [],
    },
    {
      propertyType: "cornerRadius",
      preferredPatterns: ["radius/", "border-radius/", "radii/"],
      excludedPatterns: [],
    },
    {
      propertyType: "strokeWeight",
      preferredPatterns: ["border/", "stroke/", "borders/"],
      excludedPatterns: [],
    },
    {
      propertyType: "opacity",
      preferredPatterns: ["opacity/", "alpha/"],
      excludedPatterns: [],
    },
  ],
};

/**
 * Load preferences from Figma client storage
 */
export async function loadPreferences(): Promise<VariablePreferences> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEY);

    if (stored && stored.version === CURRENT_VERSION) {
      return stored as VariablePreferences;
    }

    // Return defaults if no stored preferences or version mismatch
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.warn("Failed to load variable preferences, using defaults:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to Figma client storage
 */
export async function savePreferences(
  preferences: VariablePreferences
): Promise<void> {
  try {
    preferences.version = CURRENT_VERSION;
    await figma.clientStorage.setAsync(STORAGE_KEY, preferences);
  } catch (error) {
    console.error("Failed to save variable preferences:", error);
    throw error;
  }
}

/**
 * Get preference for a specific property type
 */
export function getPreferenceForProperty(
  preferences: VariablePreferences,
  propertyType: PropertyType
): VariablePreference | undefined {
  return preferences.preferences.find((p) => p.propertyType === propertyType);
}

/**
 * Score a variable name based on preferences
 * Higher score = better match
 * Returns -1 if variable should be excluded
 */
export function scoreVariableByPreference(
  variableName: string,
  preference: VariablePreference | undefined
): number {
  if (!preference) {
    return 0; // Neutral score if no preference
  }

  // Check if variable matches any excluded patterns
  for (const excludedPattern of preference.excludedPatterns) {
    if (variableName.toLowerCase().includes(excludedPattern.toLowerCase())) {
      return -1; // Exclude this variable
    }
  }

  // Check if variable matches any preferred patterns
  for (let i = 0; i < preference.preferredPatterns.length; i++) {
    const pattern = preference.preferredPatterns[i];
    if (variableName.toLowerCase().includes(pattern.toLowerCase())) {
      // Higher score for patterns earlier in the list
      return 100 - i * 10;
    }
  }

  return 0; // No match, neutral score
}

/**
 * Sort variable options by preference
 */
export function sortVariablesByPreference<T extends { name: string }>(
  variables: T[],
  preference: VariablePreference | undefined
): T[] {
  const scored = variables.map((variable) => ({
    variable,
    score: scoreVariableByPreference(variable.name, preference),
  }));

  // Filter out excluded variables (score = -1)
  const filtered = scored.filter((item) => item.score >= 0);

  // Sort by score (descending), then by name (ascending) for consistency
  filtered.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.variable.name.localeCompare(b.variable.name);
  });

  return filtered.map((item) => item.variable);
}

/**
 * Update preference for a specific property type
 */
export function updatePreference(
  preferences: VariablePreferences,
  propertyType: PropertyType,
  preferredPatterns: string[],
  excludedPatterns: string[]
): VariablePreferences {
  const existingIndex = preferences.preferences.findIndex(
    (p) => p.propertyType === propertyType
  );

  const newPreference: VariablePreference = {
    propertyType,
    preferredPatterns,
    excludedPatterns,
  };

  if (existingIndex >= 0) {
    // Update existing preference
    preferences.preferences[existingIndex] = newPreference;
  } else {
    // Add new preference
    preferences.preferences.push(newPreference);
  }

  return preferences;
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): VariablePreferences {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
}

/**
 * Export preferences as JSON for backup
 */
export function exportPreferences(preferences: VariablePreferences): string {
  return JSON.stringify(preferences, null, 2);
}

/**
 * Import preferences from JSON
 */
export function importPreferences(json: string): VariablePreferences {
  try {
    const parsed = JSON.parse(json);

    if (!parsed.preferences || !Array.isArray(parsed.preferences)) {
      throw new Error("Invalid preferences format");
    }

    return {
      version: CURRENT_VERSION,
      preferences: parsed.preferences,
    };
  } catch (error) {
    throw new Error(`Failed to import preferences: ${error}`);
  }
}

