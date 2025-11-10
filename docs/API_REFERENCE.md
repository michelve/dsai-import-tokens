# API Reference

## Overview

This document provides a complete reference for all functions, modules, and interfaces in the DSAI Import Tokens plugin.

## Module: main.js

Entry point for the Figma plugin. Handles plugin lifecycle, message routing, and MCP command processing.

### figma.showUI()

Displays the plugin user interface.

**Signature:**
```javascript
figma.showUI(__html__)
```

**Parameters:**
- `__html__` (string): HTML content for the UI

**Returns:** void

**Usage:**
```javascript
figma.showUI(__html__, { width: 400, height: 500 });
```

### handleMCPCommand()

Routes and processes MCP commands from AI clients.

**Signature:**
```javascript
function handleMCPCommand(command, args)
```

**Parameters:**
- `command` (string): Command name
- `args` (object): Command arguments

**Returns:** object - Command result or error

**Supported Commands:**
- `join_channel`
- `get_collections`
- `get_collection`
- `export_theme`
- `get_variable`

**Usage:**
```javascript
const result = handleMCPCommand('get_collections', {});
```

### getCollections()

Returns list of all variable collections in the file.

**Signature:**
```javascript
function getCollections()
```

**Parameters:** None

**Returns:**
```javascript
{
  collections: [
    {
      id: string,
      name: string,
      modes: string[]
    }
  ]
}
```

**Example:**
```javascript
const result = getCollections();
// {
//   collections: [
//     { id: "123:456", name: "Foundation", modes: ["Light", "Dark"] }
//   ]
// }
```

### getCollection()

Returns detailed information about a specific collection.

**Signature:**
```javascript
function getCollection(collectionId)
```

**Parameters:**
- `collectionId` (string): Figma collection ID

**Returns:** object - Collection with token structure

**Errors:**
- Returns `{ error: 'Collection not found' }` if ID is invalid

**Example:**
```javascript
const collection = getCollection('VariableCollectionId:123:456');
```

### exportTheme()

Exports all collections as Design Tokens JSON.

**Signature:**
```javascript
function exportTheme()
```

**Parameters:** None

**Returns:**
```javascript
{
  success: boolean,
  theme: object
}
```

**Example:**
```javascript
const result = exportTheme();
// {
//   success: true,
//   theme: {
//     "Foundation": { modes: { ... } },
//     "Components": { modes: { ... } }
//   }
// }
```

### getVariable()

Returns detailed information about a specific variable.

**Signature:**
```javascript
function getVariable(variableId)
```

**Parameters:**
- `variableId` (string): Figma variable ID

**Returns:**
```javascript
{
  id: string,
  name: string,
  resolvedType: string,
  description: string,
  valuesByMode: object,
  scopes: string[],
  codeSyntax: object
}
```

**Errors:**
- Returns `{ error: 'Variable not found' }` if ID is invalid

**Example:**
```javascript
const variable = getVariable('VariableID:123:456');
```

### processCollectionForExport()

Processes a collection for export with full token structure.

**Signature:**
```javascript
function processCollectionForExport(collection, variables)
```

**Parameters:**
- `collection` (VariableCollection): Figma variable collection object
- `variables` (Variable[]): Array of variables in the collection

**Returns:**
```javascript
{
  modes: {
    [modeName]: {
      [tokenPath]: tokenObject
    }
  }
}
```

**Example:**
```javascript
const collection = figma.variables.getVariableCollectionById(id);
const variables = getAllVariables(collection);
const tokens = processCollectionForExport(collection, variables);
```

### variableToTokenForExport()

Converts a Figma variable to token format with all properties.

**Signature:**
```javascript
function variableToTokenForExport(variable, modeId, collection)
```

**Parameters:**
- `variable` (Variable): Figma variable object
- `modeId` (string): Mode ID for value extraction
- `collection` (VariableCollection): Parent collection

**Returns:**
```javascript
{
  $value: string | number | boolean,
  $type: string,
  $description?: string,
  $codeSyntax?: object,
  $scopes?: string[],
  $extensions?: object
}
```

**Example:**
```javascript
const token = variableToTokenForExport(variable, modeId, collection);
```

## Module: import.js

Handles importing Design Tokens JSON into Figma variables.

### importTokens()

Main entry point for token import process.

**Signature:**
```javascript
function importTokens(tokenData)
```

**Parameters:**
- `tokenData` (object): Design Tokens JSON structure

**Returns:** void

**Side Effects:**
- Creates or updates variable collections
- Creates or updates variables
- Sets mode values

**Example:**
```javascript
const tokens = JSON.parse(fileContent);
importTokens(tokens);
```

### traverseTokens()

Recursively traverses nested token structure.

**Signature:**
```javascript
function traverseTokens(tokens, path, collection, mode, deferredAliases)
```

**Parameters:**
- `tokens` (object): Token object or group
- `path` (string): Current path with forward slash separators
- `collection` (VariableCollection): Target collection
- `mode` (Mode): Current mode
- `deferredAliases` (array): Array to store alias references for later resolution

**Returns:** void

**Side Effects:**
- Calls `createVariable()` for token definitions
- Recurses into nested groups

**Example:**
```javascript
const deferredAliases = [];
traverseTokens(tokens, '', collection, mode, deferredAliases);
```

### createVariable()

Creates or updates a Figma variable from token data.

**Signature:**
```javascript
function createVariable(tokenName, tokenData, collection, mode, deferredAliases)
```

**Parameters:**
- `tokenName` (string): Full token path with forward slash separators
- `tokenData` (object): Token definition with $value, $type, etc.
- `collection` (VariableCollection): Target collection
- `mode` (Mode): Current mode
- `deferredAliases` (array): Array to store alias references

**Returns:** Variable | null

**Example:**
```javascript
const variable = createVariable(
  'colors/brand/blue/500',
  {
    $value: '#0d6efd',
    $type: 'color',
    $description: 'Primary blue'
  },
  collection,
  mode,
  deferredAliases
);
```

### createVariableAlias()

Defers alias creation for later resolution.

**Signature:**
```javascript
function createVariableAlias(tokenName, aliasPath, tokenData, collection, mode, deferredAliases)
```

**Parameters:**
- `tokenName` (string): Full token path
- `aliasPath` (string): Alias reference path (e.g., "{colors.brand.blue.500}")
- `tokenData` (object): Token definition
- `collection` (VariableCollection): Target collection
- `mode` (Mode): Current mode
- `deferredAliases` (array): Array to store alias data

**Returns:** void

**Side Effects:**
- Adds alias data to `deferredAliases` array

**Example:**
```javascript
createVariableAlias(
  'colors/theme/primary',
  '{colors.brand.blue.500}',
  tokenData,
  collection,
  mode,
  deferredAliases
);
```

### processAliases()

Resolves all deferred aliases after variables are created.

**Signature:**
```javascript
function processAliases(deferredAliases)
```

**Parameters:**
- `deferredAliases` (array): Array of deferred alias data

**Returns:** void

**Side Effects:**
- Binds alias references to target variables
- Logs warnings for unresolvable aliases

**Example:**
```javascript
processAliases(deferredAliases);
```

### setModeValues()

Sets values for variables in additional modes.

**Signature:**
```javascript
function setModeValues(tokens, collection, mode, path)
```

**Parameters:**
- `tokens` (object): Token structure for the mode
- `collection` (VariableCollection): Target collection
- `mode` (Mode): Mode to set values for
- `path` (string): Current token path

**Returns:** void

**Side Effects:**
- Updates variable values for specified mode

**Example:**
```javascript
setModeValues(darkModeTokens, collection, darkMode, '');
```

### processExtensions()

Processes and formats extension metadata.

**Signature:**
```javascript
function processExtensions(extensions)
```

**Parameters:**
- `extensions` (object): Extension metadata object

**Returns:** object - Formatted extensions with JSON strings

**Example:**
```javascript
const formatted = processExtensions({
  docs: { reference: "https://example.com" }
});
// Returns: { docs: '{"reference":"https://example.com"}' }
```

## Module: export.js

Handles exporting Figma variables to Design Tokens JSON format.

### exportTokens()

Main entry point for token export process.

**Signature:**
```javascript
function exportTokens(mode)
```

**Parameters:**
- `mode` (string): Export mode - 'single' or 'separate'

**Returns:**
- If mode is 'single': string (JSON)
- If mode is 'separate': Array of {name, content} objects

**Example:**
```javascript
// Single file export
const json = exportTokens('single');

// Separate files export
const files = exportTokens('separate');
// [
//   { name: 'Foundation.json', content: '...' },
//   { name: 'Components.json', content: '...' }
// ]
```

### processCollection()

Processes a collection into token structure.

**Signature:**
```javascript
function processCollection(collection, variables)
```

**Parameters:**
- `collection` (VariableCollection): Figma collection object
- `variables` (Variable[]): Array of variables

**Returns:**
```javascript
{
  modes: {
    [modeName]: {
      [tokenPath]: tokenObject
    }
  }
}
```

**Example:**
```javascript
const tokens = processCollection(collection, variables);
```

### getAllVariables()

Gets all variables for a collection.

**Signature:**
```javascript
function getAllVariables(collection)
```

**Parameters:**
- `collection` (VariableCollection): Figma collection object

**Returns:** Variable[] - Array of all variables in the collection

**Example:**
```javascript
const variables = getAllVariables(collection);
```

### variableToToken()

Converts a variable to token format.

**Signature:**
```javascript
function variableToToken(variable, modeId, collection)
```

**Parameters:**
- `variable` (Variable): Figma variable
- `modeId` (string): Mode ID
- `collection` (VariableCollection): Parent collection

**Returns:**
```javascript
{
  $value: string | number | boolean,
  $type: string,
  $description?: string,
  $codeSyntax?: object,
  $scopes?: string[],
  $extensions?: object
}
```

**Example:**
```javascript
const token = variableToToken(variable, modeId, collection);
```

### getTokenType()

Maps Figma variable type to token type.

**Signature:**
```javascript
function getTokenType(figmaType)
```

**Parameters:**
- `figmaType` (string): Figma variable type (COLOR, FLOAT, STRING, BOOLEAN)

**Returns:** string - Token type (color, number, string, boolean)

**Example:**
```javascript
const tokenType = getTokenType('COLOR'); // 'color'
```

### formatValue()

Formats variable value based on type.

**Signature:**
```javascript
function formatValue(value, type)
```

**Parameters:**
- `value` (any): Variable value
- `type` (string): Variable type

**Returns:** string | number | boolean - Formatted value

**Examples:**
```javascript
// Color
formatValue({ r: 0.05, g: 0.43, b: 0.99 }, 'COLOR'); // '#0d6efd'

// Number
formatValue(16, 'FLOAT'); // 16

// String
formatValue('Roboto', 'STRING'); // 'Roboto'

// Boolean
formatValue(true, 'BOOLEAN'); // true
```

## Module: server.js

Handles HTTP server connection and token transmission.

### testConnection()

Tests connection to local HTTP server.

**Signature:**
```javascript
async function testConnection()
```

**Parameters:** None

**Returns:** Promise<boolean> - true if server is reachable, false otherwise

**Example:**
```javascript
const isReachable = await testConnection();
if (isReachable) {
  console.log('Server is available');
}
```

### startServer()

Enables remote connection after testing.

**Signature:**
```javascript
async function startServer()
```

**Parameters:** None

**Returns:** Promise<void>

**Side Effects:**
- Sends status message to UI

**Example:**
```javascript
await startServer();
```

### sendThemeToServer()

Sends all collections to HTTP server.

**Signature:**
```javascript
async function sendThemeToServer()
```

**Parameters:** None

**Returns:** Promise<void>

**Side Effects:**
- Makes POST request to http://localhost:8947/send-theme
- Sends status messages to UI

**Example:**
```javascript
await sendThemeToServer();
```

### sendCollectionToServer()

Sends a specific collection to HTTP server.

**Signature:**
```javascript
async function sendCollectionToServer(collectionId)
```

**Parameters:**
- `collectionId` (string): Figma collection ID

**Returns:** Promise<void>

**Side Effects:**
- Makes POST request to http://localhost:8947/send-collection

**Example:**
```javascript
await sendCollectionToServer('VariableCollectionId:123:456');
```

### processCollectionForExport()

Processes collection for HTTP export.

**Signature:**
```javascript
function processCollectionForExport(collection, variables)
```

**Parameters:**
- `collection` (VariableCollection): Collection object
- `variables` (Variable[]): Variables array

**Returns:** object - Token structure

**Example:**
```javascript
const tokens = processCollectionForExport(collection, variables);
```

### variableToToken()

Converts variable to token with all properties.

**Signature:**
```javascript
function variableToToken(variable, modeId, collection)
```

**Parameters:**
- `variable` (Variable): Variable object
- `modeId` (string): Mode ID
- `collection` (VariableCollection): Collection object

**Returns:** object - Token object

**Example:**
```javascript
const token = variableToToken(variable, modeId, collection);
```

## Module: utils.js

Shared utility functions used across modules.

### isAlias()

Checks if a value is an alias reference.

**Signature:**
```javascript
function isAlias(value)
```

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - true if value is alias format `{...}`

**Examples:**
```javascript
isAlias('{colors.primary}'); // true
isAlias('#0d6efd'); // false
isAlias(16); // false
```

### parseColor()

Parses color string to Figma RGB object.

**Signature:**
```javascript
function parseColor(colorString)
```

**Parameters:**
- `colorString` (string): Hex or rgba color string

**Returns:**
```javascript
{
  r: number (0-1),
  g: number (0-1),
  b: number (0-1)
}
```

**Examples:**
```javascript
parseColor('#0d6efd');
// { r: 0.050980, g: 0.431373, b: 0.992157 }

parseColor('rgba(13, 110, 253, 1)');
// { r: 0.050980, g: 0.431373, b: 0.992157 }
```

### colorToHex()

Converts Figma RGB object to hex string.

**Signature:**
```javascript
function colorToHex(rgb)
```

**Parameters:**
- `rgb` (object): RGB object with r, g, b values (0-1)

**Returns:** string - Hex color string

**Example:**
```javascript
colorToHex({ r: 0.050980, g: 0.431373, b: 0.992157 });
// '#0d6efd'
```

### mapScopes()

Maps scope strings to Figma scope enums.

**Signature:**
```javascript
function mapScopes(scopeStrings)
```

**Parameters:**
- `scopeStrings` (string[]): Array of scope strings

**Returns:** VariableScope[] - Array of Figma scope enums

**Example:**
```javascript
mapScopes(['ALL_FILLS', 'STROKE_COLOR']);
// [VariableScope.ALL_FILLS, VariableScope.STROKE_COLOR]
```

### resolveAliasPath()

Converts variable ID to alias reference string.

**Signature:**
```javascript
function resolveAliasPath(variableId, currentCollection)
```

**Parameters:**
- `variableId` (string): Target variable ID
- `currentCollection` (VariableCollection): Current collection context

**Returns:** string | null - Alias reference or null if not found

**Example:**
```javascript
resolveAliasPath('VariableID:123:456', collection);
// '{colors.brand.blue.500}'

// Cross-collection reference
resolveAliasPath('VariableID:789:012', collection);
// '{Foundation.colors.brand.blue.500}'
```

## Module: mcp-client.js

MCP WebSocket client implementation (runs in UI thread).

### connectMCPWebSocket()

Establishes WebSocket connection to MCP server.

**Signature:**
```javascript
function connectMCPWebSocket(port, channel)
```

**Parameters:**
- `port` (number): WebSocket server port
- `channel` (string): Channel name to join

**Returns:** WebSocket - WebSocket connection object

**Side Effects:**
- Creates WebSocket connection
- Sends join_channel message
- Sets up event handlers

**Example:**
```javascript
const ws = connectMCPWebSocket(3055, 'dsai');
```

### handleMCPMessage()

Processes incoming MCP messages.

**Signature:**
```javascript
function handleMCPMessage(message)
```

**Parameters:**
- `message` (object): Parsed message from MCP server

**Returns:** void

**Side Effects:**
- Forwards message to plugin code via postMessage

**Example:**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMCPMessage(message);
};
```

## Type Definitions

### TokenObject

```javascript
{
  $value: string | number | boolean,
  $type: 'color' | 'number' | 'string' | 'boolean',
  $description?: string,
  $codeSyntax?: {
    WEB?: string,
    ANDROID?: string,
    iOS?: string
  },
  $scopes?: string[],
  $extensions?: object
}
```

### CollectionStructure

```javascript
{
  modes: {
    [modeName: string]: {
      [tokenPath: string]: TokenObject | NestedGroup
    }
  }
}
```

### DeferredAlias

```javascript
{
  variableName: string,
  aliasPath: string,
  tokenData: TokenObject,
  collection: VariableCollection,
  mode: Mode
}
```

### ExportFile

```javascript
{
  name: string,
  content: string
}
```

## Constants

### Supported Variable Types

```javascript
['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']
```

### Supported Token Types

```javascript
['color', 'number', 'string', 'boolean']
```

### Supported Scopes

```javascript
[
  'ALL_SCOPES',
  'ALL_FILLS',
  'FRAME_FILL',
  'SHAPE_FILL',
  'TEXT_FILL',
  'STROKE_COLOR',
  'EFFECT_COLOR'
]
```

### Default Ports

```javascript
{
  HTTP_SERVER: 8947,
  MCP_WEBSOCKET: 3055
}
```

### Default Channel

```javascript
'dsai'
```

## Error Codes

### Collection Not Found

```javascript
{ error: 'Collection not found', collectionId: string }
```

### Variable Not Found

```javascript
{ error: 'Variable not found', variableId: string }
```

### Invalid Token Data

```javascript
{ error: 'Invalid token data', details: string }
```

### Connection Failed

```javascript
{ error: 'Connection failed', reason: string }
```

### Unknown Command

```javascript
{ error: 'Unknown command', command: string }
```
