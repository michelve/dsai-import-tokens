/**
 * DSAI Import Tokens Plugin - Export Module
 * Copyright (c) 2025. All rights reserved.
 *
 * This software is private and proprietary.
 * For use with DSAI design system only.
 */

// Export functionality - exports Figma variables to token format

import type {
	ParsedMetadata,
	PluginSettings,
	TokenCollection,
	TokenGroup,
	TokenValue,
} from "./types";
import { colorToHex, resolveAliasPath } from "./utils";

export async function exportTokens(
	settings: PluginSettings = {},
	collectionId: string | null = null,
): Promise<void> {
	try {
		const allCollections =
			await figma.variables.getLocalVariableCollectionsAsync();

		if (!allCollections || allCollections.length === 0) {
			figma.notify(
				"No variable collections found.\n\nCreate some variables first, then try exporting again.",
				{ error: true, timeout: 5000 },
			);
			figma.ui.postMessage({
				type: "export-error",
				message: "No variable collections found to export.",
			});
			return;
		}

		// Filter collections if a specific one is selected
		const collections = collectionId
			? allCollections.filter((c) => c.id === collectionId)
			: allCollections;

		if (collections.length === 0) {
			figma.notify("Selected collection not found.", {
				error: true,
				timeout: 3000,
			});
			figma.ui.postMessage({
				type: "export-error",
				message: "Selected collection not found.",
			});
			return;
		}

		// Version marker to confirm new code is running
		console.log("✓ Export v2.0 - with metadata parsing");
		console.log("Exporting", collections.length, "collection(s)");

		const exportFormat = settings.exportFormat || "single";

		// Get all variables once for reference resolution
		const allVariables = await getAllVariables();

		// DEBUG: Log first 10 variable names
		console.log("Total variables found:", allVariables.length);
		console.log("First 10 variable names:");
		for (let i = 0; i < Math.min(10, allVariables.length); i++) {
			console.log("  " + i + ":", allVariables[i].name);
		}

		if (exportFormat === "separate") {
			// Export each collection as a separate file
			const files = [];

			for (const collection of collections) {
				figma.ui.postMessage({
					type: "export-progress",
					message: `Exporting collection: ${collection.name}...`,
				});

				const collectionData = await processCollection(
					collection,
					allVariables,
					settings,
				);

				// Create individual file for this collection
				const fileName = `${collection.name.toLowerCase().replace(/\s+/g, "-")}.json`;
				files.push({
					name: fileName,
					data: { [collection.name]: collectionData },
				});
			}

			// Send multiple files to UI
			figma.notify(
				`✅ Exported ${collections.length} collection(s) as separate files`,
			);
			figma.ui.postMessage({
				type: "export-complete",
				files: files,
			});
		} else {
			// Export all collections to a single file
			const tokenData: Record<string, TokenCollection> = {};

			for (const collection of collections) {
				tokenData[collection.name] = await processCollection(
					collection,
					allVariables,
					settings,
				);
			}

			// Send single file to UI
			figma.notify(
				`✅ Exported ${collections.length} collection(s) to single file`,
			);
			figma.ui.postMessage({
				type: "export-complete",
				data: tokenData,
			});
		}
	} catch (error) {
		console.error("Export error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		figma.notify(`Export failed: ${errorMessage}`, { error: true });
		figma.ui.postMessage({
			type: "export-error",
		});
	}
}

async function processCollection(
	collection: VariableCollection,
	allVariables: Variable[],
	settings: PluginSettings = {},
): Promise<TokenCollection> {
	const collectionData: TokenCollection = {
		modes: {},
	};

	// Add collection metadata if enabled in settings
	if (settings.exportCollectionIds) {
		collectionData.$collectionId = collection.id;
		collectionData.$collectionKey = collection.key;
		const defaultMode = collection.modes.find(
			(m) => m.modeId === collection.defaultModeId,
		);
		if (defaultMode) {
			collectionData.$defaultMode = defaultMode.name;
		}
	}

	// Get all variables in this collection
	const variables = allVariables.filter(
		(v: Variable) => v.variableCollectionId === collection.id,
	);

	console.log(
		"Processing collection:",
		collection.name,
		"- Variables:",
		variables.length,
		"Modes:",
		collection.modes.length,
	);

	// Process each mode
	for (const mode of collection.modes) {
		const modeData: TokenGroup = {};
		console.log("  Processing mode:", mode.name);

		// Group variables by their path structure
		for (const variable of variables) {
			const tokenPath = variable.name.split("/");
			const value = variable.valuesByMode[mode.modeId];

			if (variable.name === "colors/brand/orange/800") {
				console.log(
					"    FOUND orange/800 in mode",
					mode.name,
					"- value:",
					value,
				);
				console.log("    About to call variableToToken...");
			}

			if (value === undefined) continue;

			// Build nested structure based on path
			let current: any = modeData; // Use any for dynamic property access
			for (let i = 0; i < tokenPath.length - 1; i++) {
				if (!current[tokenPath[i]]) {
					current[tokenPath[i]] = {};
				}
				current = current[tokenPath[i]];
			}

			// Create token object
			const tokenName = tokenPath[tokenPath.length - 1];
			const token = variableToToken(variable, value, allVariables, settings);

			if (variable.name === "colors/brand/orange/800") {
				console.log("    variableToToken returned:");
				console.log("      $description:", (token as any).$description);
				console.log(
					"      $codeSyntax:",
					JSON.stringify((token as any).$codeSyntax),
				);
				console.log(
					"      $extensions:",
					JSON.stringify((token as any).$extensions),
				);
			}

			current[tokenName] = token;
		}

		collectionData.modes[mode.name] = modeData;
	}

	return collectionData;
}

async function getAllVariables(): Promise<Variable[]> {
	const allVariables: Variable[] = [];
	const types: VariableResolvedDataType[] = [
		"COLOR",
		"FLOAT",
		"STRING",
		"BOOLEAN",
	];

	for (const type of types) {
		const variables = await figma.variables.getLocalVariablesAsync(type);
		allVariables.push(...variables);
	}

	return allVariables;
}

function parseDescriptionMetadata(description: string): ParsedMetadata {
	const result: ParsedMetadata = {
		description: "",
		codeSyntax: {},
		extensions: {}, // Always return object, never undefined
	};

	if (!description) return result;

	// Split by multiple newlines (more flexible whitespace handling)
	const parts = description.split(/\n\s*\n/);
	const cleanDescParts = [];

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim();

		// Check if this part contains metadata markers
		if (/Docs\.|Platform\./.test(part)) {
			// This is a metadata section - parse it
			const metadataItems = part.split("•");

			for (let j = 0; j < metadataItems.length; j++) {
				const item = metadataItems[j].trim();

				const colonIndex = item.indexOf(":");
				if (colonIndex === -1) continue;

				// Better key-value splitting (handles URLs with colons)
				const key = item.substring(0, colonIndex).trim();
				const value = item.substring(colonIndex + 1).trim();

				// Use switch for cleaner mapping
				switch (key) {
					case "Docs.Reference":
						if (!result.extensions.docs) result.extensions.docs = {};
						result.extensions.docs.reference = value;
						break;
					case "Docs.Section":
						if (!result.extensions.docs) result.extensions.docs = {};
						result.extensions.docs.section = value;
						break;
					case "Docs.Subsection":
						if (!result.extensions.docs) result.extensions.docs = {};
						result.extensions.docs.subsection = value;
						break;
					case "Platform.CssVariableName":
					case "Platform.CssVariable":
						result.codeSyntax.WEB = value;
						break;
					case "Platform.ScssVariableName":
						if (!result.extensions.platform) result.extensions.platform = {};
						result.extensions.platform.scssVariableName = value;
						break;
					case "Platform.CssClass":
						if (!result.extensions.platform) result.extensions.platform = {};
						result.extensions.platform.cssClass = value;
						break;
					case "Platform.RemValue":
						if (!result.extensions.platform) result.extensions.platform = {};
						result.extensions.platform.remValue = value;
						break;
					case "Platform.BootstrapVersion":
						if (!result.extensions.platform) result.extensions.platform = {};
						result.extensions.platform.bootstrapVersion = value;
						break;
					case "Platform.Viewport":
						if (!result.extensions.platform) result.extensions.platform = {};
						result.extensions.platform.viewport = value;
						break;
					default:
						// Handle unknown Platform.* metadata dynamically
						if (key.indexOf("Platform.") === 0) {
							if (!result.extensions.platform) result.extensions.platform = {};
							let platformKey = key.substring(9); // Remove "Platform."
							// Convert to camelCase
							platformKey =
								platformKey.charAt(0).toLowerCase() + platformKey.slice(1);
							result.extensions.platform[platformKey] = value;
						}
						// Handle Accessibility.* metadata dynamically
						else if (key.indexOf("Accessibility.") === 0) {
							if (!result.extensions.accessibility)
								result.extensions.accessibility = {} as any;
							let accessibilityKey = key.substring(14); // Remove "Accessibility."
							// Convert to camelCase
							accessibilityKey =
								accessibilityKey.charAt(0).toLowerCase() +
								accessibilityKey.slice(1);
							(result.extensions.accessibility as any)[accessibilityKey] =
								value;
						}
						// Handle Scale.* metadata dynamically
						else if (key.indexOf("Scale.") === 0) {
							if (!result.extensions.scale) result.extensions.scale = {} as any;
							let scaleKey = key.substring(6); // Remove "Scale."
							// Convert to camelCase
							scaleKey = scaleKey.charAt(0).toLowerCase() + scaleKey.slice(1);
							(result.extensions.scale as any)[scaleKey] = value;
						}
						// Handle Docs.* metadata dynamically (for unknown Docs fields)
						else if (key.indexOf("Docs.") === 0) {
							if (!result.extensions.docs) result.extensions.docs = {} as any;
							let docsKey = key.substring(5); // Remove "Docs."
							// Convert to camelCase
							docsKey = docsKey.charAt(0).toLowerCase() + docsKey.slice(1);
							(result.extensions.docs as any)[docsKey] = value;
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
	result.description = cleanDescParts.join("\n\n").trim();

	return result;
}

function variableToToken(
	variable: Variable,
	value: VariableValue,
	allVariables: Variable[],
	settings: PluginSettings = {},
): TokenValue {
	const token: Partial<TokenValue> = {
		$value: null as any,
		$type: getTokenType(variable.resolvedType) as any,
	};

	// DEBUG: Check what's happening with parsing
	if (variable.name === "colors/brand/orange/800") {
		console.log("=== INSIDE variableToToken for orange/800 ===");
		console.log("variable.description?", !!variable.description);
		console.log("About to call parseDescriptionMetadata...");
	}

	// Parse description to extract metadata and clean description
	if (variable.description) {
		const parsed = parseDescriptionMetadata(variable.description);

		if (variable.name === "colors/brand/orange/800") {
			console.log("parseDescriptionMetadata returned:");
			console.log("  parsed.description length:", parsed.description.length);
			console.log("  parsed.description:", parsed.description);
			console.log("  parsed.codeSyntax:", JSON.stringify(parsed.codeSyntax));
			console.log("  parsed.extensions:", JSON.stringify(parsed.extensions));
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
	}

	// Also check Figma's built-in codeSyntax property and merge
	// Figma stores codeSyntax per platform (WEB, ANDROID, iOS)
	const figmaCodeSyntax = (variable as any).codeSyntax;
	if (figmaCodeSyntax && typeof figmaCodeSyntax === "object") {
		if (!token.$codeSyntax) {
			token.$codeSyntax = {};
		}
		// Merge Figma's codeSyntax with parsed codeSyntax (parsed description takes precedence for WEB)
		if (figmaCodeSyntax.WEB && !token.$codeSyntax.WEB) {
			token.$codeSyntax.WEB = figmaCodeSyntax.WEB;
		}
		if (figmaCodeSyntax.ANDROID && !token.$codeSyntax.ANDROID) {
			token.$codeSyntax.ANDROID = figmaCodeSyntax.ANDROID;
		}
		if (figmaCodeSyntax.iOS && !token.$codeSyntax.iOS) {
			token.$codeSyntax.iOS = figmaCodeSyntax.iOS;
		}
	}

	// Handle alias vs direct value
	// Check if value is an alias object - it has 'type' and 'id' properties
	if (
		value &&
		typeof value === "object" &&
		"type" in value &&
		value.type === "VARIABLE_ALIAS"
	) {
		// This is an alias reference
		const aliasPath = resolveAliasPath(value.id, allVariables);
		if (aliasPath) {
			token.$value = aliasPath;
		} else {
			console.warn(
				`Could not resolve alias for variable: ${variable.name}, id: ${value.id}`,
			);
			token.$value = `{UNRESOLVED_ALIAS_${value.id}}`;
		}
	} else if (value !== undefined && value !== null) {
		// Direct value
		token.$value = formatValue(value, variable.resolvedType);
	} else {
		// No value found
		console.warn(`No value found for variable: ${variable.name}`);
		token.$value = "" as any; // Fallback for undefined values
	}

	// Add scopes if not default
	if (
		variable.scopes &&
		variable.scopes.length > 0 &&
		!variable.scopes.includes("ALL_SCOPES")
	) {
		token.$scopes = variable.scopes;
	}

	// Add Figma variable IDs if enabled in settings
	if (settings.exportVariableIds) {
		if (!token.$extensions) {
			token.$extensions = {};
		}
		token.$extensions.figma = {
			variableId: variable.id,
			collectionId: variable.variableCollectionId,
			key: variable.key,
			hiddenFromPublishing: variable.hiddenFromPublishing,
		};
	}

	return token as TokenValue;
}

function getTokenType(figmaType: VariableResolvedDataType): string {
	const typeMap: Record<VariableResolvedDataType, string> = {
		COLOR: "color",
		FLOAT: "number",
		STRING: "string",
		BOOLEAN: "boolean",
	};
	return typeMap[figmaType] || "string";
}

function formatValue(
	value: VariableValue,
	type: VariableResolvedDataType,
): string | number | boolean {
	// Safety check for alias objects that shouldn't be here
	if (
		value &&
		typeof value === "object" &&
		"type" in value &&
		value.type === "VARIABLE_ALIAS"
	) {
		console.error("ERROR: Alias object passed to formatValue!", value);
		return `{ERROR_ALIAS_${value.id}}`;
	}

	switch (type) {
		case "COLOR":
			if (
				value &&
				typeof value === "object" &&
				"r" in value &&
				"g" in value &&
				"b" in value
			) {
				return colorToHex(value as RGB | RGBA);
			}
			console.error("ERROR: Invalid color value", value);
			return "#000000";
		case "FLOAT":
			return value as number;
		case "BOOLEAN":
			return value as boolean;
		case "STRING":
			return value as string;
		default:
			return value as string | number | boolean;
	}
}
