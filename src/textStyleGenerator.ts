/**
 * Text Style Generator
 * Automatically generates Figma text styles from text layers with typography properties
 */

export interface TextStyleProperties {
  fontFamily: string;
  fontStyle: string;
  fontWeight: number | string;
  fontSize: number;
  lineHeight?: { value: number; unit: string };
  letterSpacing?: { value: number; unit: string };
  paragraphSpacing?: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
}

export interface TextStyleCandidate {
  id: string; // Unique ID for this candidate
  suggestedName: string;
  properties: TextStyleProperties;
  nodeIds: string[]; // Text nodes with these exact properties
  nodeCount: number;
  // Bound variables (if properties come from variables)
  // Store the actual Variable objects for direct binding
  boundVariables?: Map<string, Variable>;
  // Existing style info
  existingStyle?: {
    id: string;
    name: string;
  };
}

interface FontInfo {
  family: string;
  style: string;
}

/**
 * Scan text layers and group them by their typography properties
 */
export async function scanForTextStyles(
  scope: 'current' | 'all' | 'selection'
): Promise<TextStyleCandidate[]> {
  const candidates: Map<string, TextStyleCandidate> = new Map();
  const allVariables = await getAllVariables();
  const existingStyles = await figma.getLocalTextStylesAsync();

  // Determine what to scan
  let nodesToScan: readonly SceneNode[] = [];

  if (scope === 'selection') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      throw new Error('No nodes selected. Please select text layers to scan.');
    }
    nodesToScan = selection;
  } else if (scope === 'current') {
    nodesToScan = [figma.currentPage];
  } else {
    nodesToScan = figma.root.children; // All pages
  }

  // Find all text nodes
  for (const node of nodesToScan) {
    await scanNodeForTextProperties(node, candidates, allVariables, existingStyles);
  }

  return Array.from(candidates.values());
}

/**
 * Recursively scan a node and its children for text properties
 */
async function scanNodeForTextProperties(
  node: BaseNode,
  candidates: Map<string, TextStyleCandidate>,
  allVariables: Variable[],
  existingStyles: TextStyle[]
): Promise<void> {
  if (node.type === 'TEXT') {
    await processTextNode(node as TextNode, candidates, allVariables, existingStyles);
  }

  if ('children' in node) {
    for (const child of node.children) {
      await scanNodeForTextProperties(child, candidates, allVariables, existingStyles);
    }
  }
}

/**
 * Process a single text node
 */
async function processTextNode(
  node: TextNode,
  candidates: Map<string, TextStyleCandidate>,
  allVariables: Variable[],
  existingStyles: TextStyle[]
): Promise<void> {
  // Extract properties (even if text already has a style - user might want to regenerate)
  const properties = await extractTextProperties(node);
  if (!properties) {
    console.log('Could not extract properties from text node:', node.name, {
      fontName: node.fontName,
      fontSize: node.fontSize
    });
    return;
  }

  // Extract bound variables if properties are bound to variables
  const boundVariables = extractBoundVariables(node, allVariables);

  // Create a unique key for this property combination
  const key = createPropertyKey(properties);

  if (candidates.has(key)) {
    // Add this node to existing candidate
    const candidate = candidates.get(key)!;
    candidate.nodeIds.push(node.id);
    candidate.nodeCount++;
  } else {
    // Create new candidate
    const suggestedName = generateStyleName(properties, boundVariables);
    const existingStyle = findMatchingStyle(properties, existingStyles);

    candidates.set(key, {
      id: key,
      suggestedName,
      properties,
      nodeIds: [node.id],
      nodeCount: 1,
      boundVariables,
      existingStyle: existingStyle ? {
        id: existingStyle.id,
        name: existingStyle.name
      } : undefined
    });
  }
}

/**
 * Extract typography properties from a text node
 */
async function extractTextProperties(node: TextNode): Promise<TextStyleProperties | null> {
  // Handle mixed text properties - if text has mixed properties, skip for now
  if (node.fontName === figma.mixed) {
    return null;
  }

  const fontName = node.fontName as FontName;
  
  // Get font info
  const fontFamily = fontName.family;
  const fontStyle = fontName.style;
  
  // Get font weight - extract numeric weight from style if possible
  const fontWeight = extractFontWeight(fontStyle);

  // Get font size
  if (typeof node.fontSize !== 'number') {
    return null; // Mixed font sizes
  }
  const fontSize = node.fontSize;

  // Line height (can be 'AUTO' or an object with value/unit)
  let lineHeight: { value: number; unit: string } | undefined;
  if (node.lineHeight !== figma.mixed && node.lineHeight !== 'AUTO' && typeof node.lineHeight === 'object' && node.lineHeight !== null && 'value' in node.lineHeight) {
    lineHeight = {
      value: node.lineHeight.value,
      unit: node.lineHeight.unit
    };
  } else if (node.lineHeight === 'AUTO') {
    // If AUTO, calculate from fontSize (typically 1.2 - 1.5x)
    // We'll store undefined and let the fallback handle it
    lineHeight = undefined;
  }

  // Letter spacing (check for object, not truthy value - 0 is valid!)
  let letterSpacing: { value: number; unit: string } | undefined;
  if (node.letterSpacing !== figma.mixed && typeof node.letterSpacing === 'object' && node.letterSpacing !== null && 'value' in node.letterSpacing) {
    letterSpacing = {
      value: node.letterSpacing.value,
      unit: node.letterSpacing.unit
    };
  }

  // Paragraph spacing (0 is valid, so check type only)
  let paragraphSpacing: number | undefined;
  if (node.paragraphSpacing !== figma.mixed && typeof node.paragraphSpacing === 'number') {
    paragraphSpacing = node.paragraphSpacing;
  }

  // Text case
  const textCase = node.textCase || 'ORIGINAL';

  // Text decoration
  const textDecoration = node.textDecoration || 'NONE';

  const properties = {
    fontFamily,
    fontStyle,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    textCase,
    textDecoration
  };

  console.log('📝 Extracted properties from node:', node.name, {
    fontSize,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    rawLineHeight: node.lineHeight,
    rawLetterSpacing: node.letterSpacing,
    rawParagraphSpacing: node.paragraphSpacing
  });

  return properties;
}

/**
 * Helper to extract a single bound variable from boundVariables array
 */
function extractBoundVariable(
  boundValue: any,
  allVariables: Variable[]
): Variable | undefined {
  // boundVariables returns ARRAYS of VariableAlias objects
  if (boundValue && Array.isArray(boundValue) && boundValue.length > 0) {
    const varId = boundValue[0].id;
    return allVariables.find(v => v.id === varId);
  }
  // Fallback for single object (shouldn't happen but handle it)
  else if (boundValue && typeof boundValue === 'object' && 'id' in boundValue) {
    return allVariables.find(v => v.id === boundValue.id);
  }
  return undefined;
}

/**
 * Extract bound Variable objects for typography properties
 */
function extractBoundVariables(node: TextNode, allVariables: Variable[]): Map<string, Variable> | undefined {
  if (!node.boundVariables) {
    return undefined;
  }

  const bound = node.boundVariables;
  const variableMap = new Map<string, Variable>();

  console.log('🔍 Extracting bound variables from node:', node.name, {
    boundVariables: bound,
    allFieldKeys: Object.keys(bound)
  });

  // All bindable text fields
  const fields: Array<keyof typeof bound> = [
    'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
    'lineHeight', 'letterSpacing', 'paragraphSpacing', 'paragraphIndent'
  ];

  for (const field of fields) {
    const boundValue = bound[field];
    console.log(`  Checking ${field}:`, boundValue, 'isArray:', Array.isArray(boundValue));
    const variable = extractBoundVariable(boundValue, allVariables);
    if (variable) {
      console.log(`  ✅ Found variable for ${field}:`, variable.name);
      variableMap.set(field, variable);
    } else if (boundValue) {
      console.log(`  ⚠️ BoundValue exists but variable not found for ${field}`);
    }
  }

  console.log('📊 Total variables extracted:', variableMap.size, 'fields:', Array.from(variableMap.keys()));

  return variableMap.size > 0 ? variableMap : undefined;
}

/**
 * Generate a suggested style name based on properties and variables
 */
function generateStyleName(
  properties: TextStyleProperties,
  boundVariables?: Map<string, Variable>
): string {
  // Strategy 1: Use variable names if available
  if (boundVariables && boundVariables.size > 0) {
    // Try to extract a meaningful name from variable paths
    // e.g., "typography/heading/h1/size" → "Heading/H1"
    const candidates: string[] = [];

    for (const variable of boundVariables.values()) {
      if (variable.name) {
        candidates.push(variable.name);
      }
    }

    if (candidates.length > 0) {
      // Use the most common pattern - take the first variable and extract hierarchy
      const firstVar = candidates[0];
      const parts = firstVar.split('/');
      
      // Remove generic terms like "typography", "size", "weight", etc.
      const filtered = parts.filter(p => 
        !['typography', 'type', 'size', 'weight', 'height', 'spacing', 'font'].includes(p.toLowerCase())
      );

      if (filtered.length > 0) {
        // Capitalize each part
        const name = filtered
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join('/');
        return name;
      }
    }
  }

  // Strategy 2: Generate from properties based on Bootstrap 5 standards
  // Bootstrap base: 16px (1rem)
  // Display: 96px (display-1), 88px, 72px, 56px, 48px, 40px (display-6)
  // Headings: 40px (h1), 32px (h2), 28px (h3), 24px (h4), 20px (h5), 16px (h6)
  // Lead: 20px (1.25rem)
  // Body: 16px (1rem)
  // Small: 14px (0.875rem)
  const { fontFamily, fontSize, fontWeight } = properties;
  
  // Categorize by size following Bootstrap 5 typography
  let sizeCategory = 'Body';
  let specificLevel = '';
  
  if (fontSize >= 72) {
    sizeCategory = 'Display';
    if (fontSize >= 96) specificLevel = '/1';
    else if (fontSize >= 88) specificLevel = '/2';
    else if (fontSize >= 72) specificLevel = '/3';
    else if (fontSize >= 56) specificLevel = '/4';
    else if (fontSize >= 48) specificLevel = '/5';
    else specificLevel = '/6';
  } else if (fontSize >= 40) {
    sizeCategory = 'Heading';
    specificLevel = '/H1';
  } else if (fontSize >= 32) {
    sizeCategory = 'Heading';
    specificLevel = '/H2';
  } else if (fontSize >= 28) {
    sizeCategory = 'Heading';
    specificLevel = '/H3';
  } else if (fontSize >= 24) {
    sizeCategory = 'Heading';
    specificLevel = '/H4';
  } else if (fontSize >= 20) {
    sizeCategory = fontSize > 20 ? 'Heading' : 'Lead';
    specificLevel = fontSize > 20 ? '/H5' : '';
  } else if (fontSize >= 16) {
    sizeCategory = 'Body';
    specificLevel = fontSize === 16 ? '' : '/Large';
  } else if (fontSize >= 14) {
    sizeCategory = 'Small';
  } else {
    sizeCategory = 'Caption';
  }

  // Categorize by weight
  let weightCategory = '';
  const weight = typeof fontWeight === 'number' ? fontWeight : parseFontWeight(fontWeight);
  if (weight >= 700) weightCategory = 'Bold';
  else if (weight >= 600) weightCategory = 'Semibold';
  else if (weight >= 500) weightCategory = 'Medium';
  else if (weight <= 300) weightCategory = 'Light';
  else weightCategory = 'Regular';

  // Build final name
  const baseName = `${sizeCategory}${specificLevel}`;
  return weightCategory === 'Regular' ? baseName : `${baseName}/${weightCategory}`;
}

/**
 * Extract numeric font weight from font style string
 */
function extractFontWeight(fontStyle: string): number | string {
  // Try to extract numeric weight from style name
  const weightMap: Record<string, number> = {
    'thin': 100,
    'extralight': 200,
    'ultra light': 200,
    'light': 300,
    'regular': 400,
    'normal': 400,
    'medium': 500,
    'semibold': 600,
    'semi bold': 600,
    'bold': 700,
    'extrabold': 800,
    'extra bold': 800,
    'black': 900,
    'heavy': 900
  };

  const styleLower = fontStyle.toLowerCase();
  
  for (const [name, weight] of Object.entries(weightMap)) {
    if (styleLower.includes(name)) {
      return weight;
    }
  }

  // Try to find numeric weight in style string (e.g., "Inter 400", "Roboto W500")
  const numMatch = fontStyle.match(/\d{3}/);
  if (numMatch) {
    return parseInt(numMatch[0]);
  }

  return 400; // Default to regular
}

/**
 * Parse font weight string to number
 */
function parseFontWeight(weight: string | number): number {
  if (typeof weight === 'number') return weight;
  
  const num = parseInt(weight);
  return isNaN(num) ? 400 : num;
}

/**
 * Create a unique key for a property combination
 */
function createPropertyKey(properties: TextStyleProperties): string {
  const parts = [
    properties.fontFamily,
    properties.fontStyle,
    properties.fontWeight,
    properties.fontSize,
    properties.lineHeight ? `lh:${properties.lineHeight.value}${properties.lineHeight.unit}` : 'lh:auto',
    properties.letterSpacing ? `ls:${properties.letterSpacing.value}${properties.letterSpacing.unit}` : 'ls:0',
    properties.paragraphSpacing ? `ps:${properties.paragraphSpacing}` : 'ps:0',
    properties.textCase || 'ORIGINAL',
    properties.textDecoration || 'NONE'
  ];
  
  return parts.join('|');
}

/**
 * Find if an existing text style matches these properties
 */
function findMatchingStyle(
  properties: TextStyleProperties,
  existingStyles: TextStyle[]
): TextStyle | undefined {
  for (const style of existingStyles) {
    if (
      style.fontName.family === properties.fontFamily &&
      style.fontName.style === properties.fontStyle &&
      style.fontSize === properties.fontSize
    ) {
      // Check other properties if they exist
      let matches = true;

      if (properties.lineHeight && style.lineHeight && typeof style.lineHeight === 'object') {
        if (style.lineHeight.value !== properties.lineHeight.value) {
          matches = false;
        }
      }

      if (properties.letterSpacing && style.letterSpacing && typeof style.letterSpacing === 'object') {
        if (style.letterSpacing.value !== properties.letterSpacing.value) {
          matches = false;
        }
      }

      if (properties.paragraphSpacing !== undefined && style.paragraphSpacing !== properties.paragraphSpacing) {
        matches = false;
      }

      if (matches) {
        return style;
      }
    }
  }

  return undefined;
}

/**
 * Create text styles from candidates
 */
export async function createTextStyles(
  candidates: TextStyleCandidate[],
  updateExisting: boolean
): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  // Get all variables for binding
  const allVariables = await getAllVariables();

  for (const candidate of candidates) {
    try {
      const { properties, suggestedName, existingStyle, nodeIds, boundVariables } = candidate;
      
      console.log('🎨 Creating style:', suggestedName, {
        hasBoundVariables: !!boundVariables,
        boundVariableCount: boundVariables?.size || 0,
        boundFields: boundVariables ? Array.from(boundVariables.keys()) : []
      });

      // Load the font first (required before creating text style)
      await figma.loadFontAsync({
        family: properties.fontFamily,
        style: properties.fontStyle
      });

      let textStyle: TextStyle;

      if (existingStyle && updateExisting) {
        // Update existing style
        const foundStyle = await figma.getStyleByIdAsync(existingStyle.id);
        if (!foundStyle || foundStyle.type !== 'TEXT') {
          throw new Error(`Style ${existingStyle.name} not found or is not a text style`);
        }
        textStyle = foundStyle as TextStyle;
        updated++;
      } else if (existingStyle && !updateExisting) {
        // Skip existing style
        skipped++;
        continue;
      } else {
        // Create new style
        textStyle = figma.createTextStyle();
        textStyle.name = suggestedName;
        created++;
      }

      // Set properties
      textStyle.fontName = {
        family: properties.fontFamily,
        style: properties.fontStyle
      };

      // Set fontSize - use variable if bound, otherwise hardcoded value
      if (boundVariables?.has('fontSize')) {
        const variable = boundVariables.get('fontSize')!;
        textStyle.setBoundVariable('fontSize', variable);
        console.log('✅ Applied fontSize variable:', variable.name);
      } else {
        textStyle.fontSize = properties.fontSize;
        console.log('ℹ️ No fontSize variable, using hardcoded:', properties.fontSize);
      }

      // Set lineHeight - use variable if bound, otherwise use value or accessibility fallback
      if (boundVariables?.has('lineHeight')) {
        const variable = boundVariables.get('lineHeight')!;
        textStyle.setBoundVariable('lineHeight', variable);
        console.log('✅ Applied lineHeight variable:', variable.name);
      } else if (properties.lineHeight) {
        textStyle.lineHeight = properties.lineHeight;
      } else {
        // Accessibility fallback: minimum 1.5 for body text, 1.2 for large headings
        const accessibleLineHeight = properties.fontSize >= 32 ? 1.2 : 1.5;
        textStyle.lineHeight = { value: accessibleLineHeight, unit: 'PERCENT' };
        console.log('📐 Applied accessible lineHeight fallback:', accessibleLineHeight);
      }

      // Set letterSpacing - use variable if bound, otherwise use value or default (0)
      if (boundVariables?.has('letterSpacing')) {
        const variable = boundVariables.get('letterSpacing')!;
        textStyle.setBoundVariable('letterSpacing', variable);
        console.log('✅ Applied letterSpacing variable:', variable.name);
      } else if (properties.letterSpacing) {
        textStyle.letterSpacing = properties.letterSpacing;
      } else {
        // Default: 0 for normal text (accessibility guideline: never negative)
        textStyle.letterSpacing = { value: 0, unit: 'PIXELS' };
        console.log('📐 Applied default letterSpacing: 0');
      }

      // Set paragraphSpacing - use variable if bound, otherwise use value or accessibility fallback
      if (boundVariables?.has('paragraphSpacing')) {
        const variable = boundVariables.get('paragraphSpacing')!;
        textStyle.setBoundVariable('paragraphSpacing', variable);
        console.log('✅ Applied paragraphSpacing variable:', variable.name);
      } else if (properties.paragraphSpacing !== undefined && properties.paragraphSpacing > 0) {
        textStyle.paragraphSpacing = properties.paragraphSpacing;
      } else {
        // Accessibility fallback: 1.5× to 2× font size for comfortable reading
        const accessibleParagraphSpacing = Math.round(properties.fontSize * 1.5);
        textStyle.paragraphSpacing = accessibleParagraphSpacing;
        console.log('📐 Applied accessible paragraphSpacing fallback:', accessibleParagraphSpacing, 'px');
      }

      // Set paragraphIndent - use variable if bound
      if (boundVariables?.has('paragraphIndent')) {
        const variable = boundVariables.get('paragraphIndent')!;
        textStyle.setBoundVariable('paragraphIndent', variable);
        console.log('✅ Applied paragraphIndent variable:', variable.name);
      }

      // Set fontFamily - use variable if bound
      if (boundVariables?.has('fontFamily')) {
        const variable = boundVariables.get('fontFamily')!;
        textStyle.setBoundVariable('fontFamily', variable);
        console.log('✅ Applied fontFamily variable:', variable.name);
      }

      // Set fontStyle - use variable if bound
      if (boundVariables?.has('fontStyle')) {
        const variable = boundVariables.get('fontStyle')!;
        textStyle.setBoundVariable('fontStyle', variable);
        console.log('✅ Applied fontStyle variable:', variable.name);
      }

      // Set fontWeight - use variable if bound
      if (boundVariables?.has('fontWeight')) {
        const variable = boundVariables.get('fontWeight')!;
        textStyle.setBoundVariable('fontWeight', variable);
        console.log('✅ Applied fontWeight variable:', variable.name);
      }

      if (properties.textCase) {
        textStyle.textCase = properties.textCase;
      }

      if (properties.textDecoration) {
        textStyle.textDecoration = properties.textDecoration;
      }

      // Apply the style to all nodes with these properties
      for (const nodeId of nodeIds) {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (node && node.type === 'TEXT') {
          await (node as TextNode).setTextStyleIdAsync(textStyle.id);
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate.suggestedName}: ${message}`);
    }
  }

  return { created, updated, skipped, errors };
}

/**
 * Get all local variables
 */
async function getAllVariables(): Promise<Variable[]> {
  const allVariables: Variable[] = [];
  const types: VariableResolvedDataType[] = ['FLOAT', 'STRING', 'COLOR', 'BOOLEAN'];
  
  for (const type of types) {
    const variables = await figma.variables.getLocalVariablesAsync(type);
    allVariables.push(...variables);
  }
  
  return allVariables;
}

