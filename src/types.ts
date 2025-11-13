/**
 * DSAI Import Tokens Plugin - Type Definitions
 * Copyright (c) 2025. All rights reserved.
 */

// ============================================================================
// Settings Types
// ============================================================================

export interface PluginSettings {
  exportFormat?: 'single' | 'separate';
  serverEnabled?: boolean;
  serverPort?: number;
  [key: string]: unknown;
}

// ============================================================================
// Token Types (W3C Design Tokens Format)
// ============================================================================

export interface TokenValue {
  $value: string | number | boolean | TokenAlias;
  $type: TokenType;
  $description?: string;
  $codeSyntax?: CodeSyntax;
  $extensions?: TokenExtensions;
  $scopes?: string[];
}

export type TokenType = 
  | 'color' 
  | 'dimension' 
  | 'fontFamily' 
  | 'fontWeight' 
  | 'duration' 
  | 'cubicBezier' 
  | 'number' 
  | 'string'
  | 'boolean';

export interface TokenAlias {
  $alias: string;
}

export interface CodeSyntax {
  WEB?: string;
  ANDROID?: string;
  iOS?: string;
  [platform: string]: string | undefined;
}

export interface TokenExtensions {
  docs?: {
    reference?: string;
    section?: string;
    subsection?: string;
    [key: string]: string | undefined;
  };
  platform?: {
    scssVariableName?: string;
    cssClass?: string;
    remValue?: string;
    bootstrapVersion?: string;
    viewport?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

// ============================================================================
// Token Collection Types
// ============================================================================

export interface TokenCollection {
  modes: {
    [modeName: string]: TokenGroup;
  };
}

export interface TokenGroup {
  [key: string]: TokenValue | TokenGroup;
}

export interface TokenData {
  [collectionName: string]: TokenCollection;
}

// ============================================================================
// Export File Types
// ============================================================================

export interface ExportFile {
  name: string;
  data: TokenData;
}

// ============================================================================
// Parsed Description Metadata
// ============================================================================

export interface ParsedMetadata {
  description: string;
  codeSyntax: CodeSyntax;
  extensions: TokenExtensions;
}

// ============================================================================
// UI Message Types
// ============================================================================

export type UIMessageType =
  | 'import-tokens'
  | 'export-tokens'
  | 'export-specific-collection'
  | 'create-theme-collections'
  | 'toggle-server'
  | 'save-settings'
  | 'load-settings';

export interface UIMessage {
  type: UIMessageType;
  data?: unknown;
  settings?: PluginSettings;
  collectionName?: string;
}

export type MainMessageType =
  | 'import-progress'
  | 'import-success'
  | 'import-error'
  | 'export-progress'
  | 'export-complete'
  | 'export-error'
  | 'server-status'
  | 'settings-loaded'
  | 'error';

export interface MainMessage {
  type: MainMessageType;
  message?: string;
  data?: TokenData;
  files?: ExportFile[];
  settings?: PluginSettings;
  status?: string;
  port?: number;
}

