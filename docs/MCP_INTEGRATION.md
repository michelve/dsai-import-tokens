# MCP Integration Guide

## Overview

The DSAI Import Tokens plugin integrates with Model Context Protocol (MCP) servers to enable AI-assisted design token management. This allows AI clients like Claude Desktop and Cursor to query and manipulate Figma variables through natural language commands.

## Architecture

### Components

**Figma Plugin:**
- Runs in Figma's JavaScript sandbox (no WebSocket support)
- Communicates with UI thread via postMessage
- Processes MCP commands and returns results

**UI WebSocket Client:**
- Runs in plugin UI iframe (has browser APIs)
- Connects to external MCP WebSocket server
- Bridges messages between Figma and MCP server

**MCP WebSocket Server:**
- External Node.js server with WebSocket support
- Listens on port 3055 (default)
- Routes messages between AI clients and plugin

**AI Client:**
- Claude Desktop, Cursor, or other MCP-compatible client
- Sends natural language requests
- Receives structured responses

### Message Flow

```
AI Client (Claude/Cursor)
    |
    | MCP Protocol
    |
    v
MCP WebSocket Server (port 3055)
    |
    | WebSocket
    |
    v
Plugin UI (WebSocket Client)
    |
    | postMessage
    |
    v
Plugin Code (Figma Sandbox)
    |
    | Figma API
    |
    v
Figma Variables/Collections
```

## MCP Server Configuration

### Installation

The MCP server is provided by the `figma-tokens-mcp` package:

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": [
        "-y",
        "figma-tokens-mcp"
      ]
    }
  }
}
```

### Default Settings

- **Protocol:** WebSocket
- **Port:** 3055
- **Channel:** "dsai" (hardcoded)
- **Transport:** stdio (between AI client and MCP server)

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"]
    }
  }
}
```

### Cursor Configuration

Add to MCP settings in Cursor:

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"]
    }
  }
}
```

## Plugin MCP Configuration

### UI Configuration

The plugin provides an MCP tab with configuration options:

**MCP Server Toggle:**
- Enable/disable MCP connection
- Persists across sessions

**Port Configuration:**
- Default: 3055
- Configurable for custom setups
- Validated on connection

**Channel Configuration:**
- Default: "dsai"
- Currently hardcoded in implementation
- Must match server expectations

### WebSocket Connection

The UI establishes a WebSocket connection when MCP is enabled:

```javascript
function connectMCPWebSocket(port, channel) {
  const ws = new WebSocket(`ws://localhost:${port}`);
  
  ws.onopen = () => {
    console.log('MCP WebSocket connected');
    // Join channel
    ws.send(JSON.stringify({
      type: 'join_channel',
      channel: channel
    }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMCPMessage(message);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed');
  };
}
```

### Message Handling

Messages from AI client are forwarded to plugin code:

```javascript
function handleMCPMessage(message) {
  // Forward to plugin sandbox
  parent.postMessage({
    pluginMessage: {
      type: 'mcp-command',
      command: message.command,
      args: message.args
    }
  }, '*');
}
```

Plugin processes command and returns result:

```javascript
figma.ui.onmessage = (msg) => {
  if (msg.type === 'mcp-command') {
    const result = handleMCPCommand(msg.command, msg.args);
    
    // Send result back to UI
    figma.ui.postMessage({
      type: 'mcp-result',
      result: result
    });
  }
};
```

UI forwards result to MCP server:

```javascript
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'mcp-result') {
    ws.send(JSON.stringify({
      type: 'result',
      data: msg.result
    }));
  }
};
```

## Available MCP Tools

### 1. join_channel

**Description:** Join a specific channel for communication.

**Parameters:**

```json
{
  "channel": "dsai"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Joined channel: dsai"
}
```

**Usage:**

Automatically called when WebSocket connection is established. Not typically invoked by AI client directly.

### 2. get_collections

**Description:** Get list of all variable collections in the Figma file.

**Parameters:** None

**Response:**

```json
{
  "collections": [
    {
      "id": "VariableCollectionId:123:456",
      "name": "Foundation",
      "modes": ["Light", "Dark"]
    },
    {
      "id": "VariableCollectionId:123:789",
      "name": "Components",
      "modes": ["Light", "Dark"]
    }
  ]
}
```

**AI Usage Example:**

User: "What design token collections do we have?"

AI: Calls `get_collections` → Returns list of collections

### 3. get_collection

**Description:** Get detailed information about a specific collection including all variables.

**Parameters:**

```json
{
  "collectionId": "VariableCollectionId:123:456"
}
```

**Response:**

```json
{
  "Foundation": {
    "modes": {
      "Light": {
        "colors": {
          "brand": {
            "blue": {
              "500": {
                "$value": "#0d6efd",
                "$type": "color",
                "$description": "Primary brand blue",
                "$codeSyntax": {
                  "WEB": "var(--bs-blue-500)"
                },
                "$scopes": ["ALL_FILLS", "STROKE_COLOR"]
              }
            }
          }
        }
      },
      "Dark": {
        "colors": {
          "brand": {
            "blue": {
              "500": {
                "$value": "#0d6efd",
                "$type": "color"
              }
            }
          }
        }
      }
    }
  }
}
```

**AI Usage Example:**

User: "Show me all the color tokens in the Foundation collection."

AI: Calls `get_collection` with Foundation ID → Filters color tokens → Presents results

### 4. export_theme

**Description:** Export all collections as complete Design Tokens JSON.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "theme": {
    "Foundation": {
      "modes": {
        "Light": { ... },
        "Dark": { ... }
      }
    },
    "Components": {
      "modes": {
        "Light": { ... },
        "Dark": { ... }
      }
    }
  }
}
```

**AI Usage Example:**

User: "Export all design tokens as JSON."

AI: Calls `export_theme` → Formats and presents JSON structure

### 5. get_variable

**Description:** Get detailed information about a specific variable by ID.

**Parameters:**

```json
{
  "variableId": "VariableID:123:456"
}
```

**Response:**

```json
{
  "id": "VariableID:123:456",
  "name": "colors/brand/blue/500",
  "resolvedType": "COLOR",
  "description": "Primary brand blue",
  "valuesByMode": {
    "Light": "#0d6efd",
    "Dark": "#0d6efd"
  },
  "scopes": ["ALL_FILLS", "STROKE_COLOR"],
  "codeSyntax": {
    "WEB": "var(--bs-blue-500)",
    "ANDROID": "R.color.blue_500"
  }
}
```

**AI Usage Example:**

User: "What are the values for the primary color variable?"

AI: Searches for variable → Calls `get_variable` with ID → Presents values

## Implementation Details

### Command Handler

The plugin's main command handler routes MCP commands:

```javascript
function handleMCPCommand(command, args) {
  switch (command) {
    case 'get_collections':
      return getCollections();
      
    case 'get_collection':
      return getCollection(args.collectionId);
      
    case 'export_theme':
      return exportTheme();
      
    case 'get_variable':
      return getVariable(args.variableId);
      
    default:
      return { error: 'Unknown command' };
  }
}
```

### Collection Listing

```javascript
function getCollections() {
  const collections = figma.variables.getLocalVariableCollections();
  
  return {
    collections: collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map(mode => mode.name)
    }))
  };
}
```

### Collection Retrieval

```javascript
function getCollection(collectionId) {
  const collection = figma.variables.getVariableCollectionById(collectionId);
  
  if (!collection) {
    return { error: 'Collection not found' };
  }
  
  const variables = getAllVariables(collection);
  const tokens = processCollectionForExport(collection, variables);
  
  return {
    [collection.name]: tokens
  };
}
```

### Theme Export

```javascript
function exportTheme() {
  const collections = figma.variables.getLocalVariableCollections();
  const allTokens = {};
  
  for (const collection of collections) {
    const variables = getAllVariables(collection);
    allTokens[collection.name] = processCollectionForExport(collection, variables);
  }
  
  return {
    success: true,
    theme: allTokens
  };
}
```

### Variable Retrieval

```javascript
function getVariable(variableId) {
  const variable = figma.variables.getVariableById(variableId);
  
  if (!variable) {
    return { error: 'Variable not found' };
  }
  
  const collection = figma.variables.getVariableCollectionById(
    variable.variableCollectionId
  );
  
  return {
    id: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType,
    description: variable.description,
    valuesByMode: formatValuesByMode(variable, collection),
    scopes: variable.scopes,
    codeSyntax: variable.codeSyntax
  };
}
```

## AI Interaction Examples

### Querying Collections

**User Prompt:**
"What design token collections are available in this Figma file?"

**AI Process:**
1. Calls `get_collections` tool
2. Receives list of collections with names and modes
3. Formats response for user

**AI Response:**
"The file has 2 design token collections:
1. Foundation - with Light and Dark modes
2. Components - with Light and Dark modes"

### Analyzing Tokens

**User Prompt:**
"Show me all the primary colors across all collections."

**AI Process:**
1. Calls `get_collections` to list collections
2. For each collection, calls `get_collection`
3. Filters tokens where path contains "primary" and type is "color"
4. Formats results

**AI Response:**
"Found 3 primary color tokens:
- Foundation/colors/theme/primary: #0d6efd (Light), #0dcaf0 (Dark)
- Components/button/primary: {Foundation.colors.theme.primary} (alias)
- Components/link/primary: {Foundation.colors.theme.primary} (alias)"

### Exporting Data

**User Prompt:**
"Export all design tokens to JSON format."

**AI Process:**
1. Calls `export_theme` tool
2. Receives complete theme data
3. Formats as JSON

**AI Response:**
"Here's the complete design token export: [JSON data]"

### Checking Variables

**User Prompt:**
"What's the value of the primary button background color?"

**AI Process:**
1. Calls `get_collections` to find button-related collection
2. Calls `get_collection` for Components collection
3. Searches for button/primary/background token
4. If token is alias, resolves reference

**AI Response:**
"The primary button background color references Foundation/colors/theme/primary, which has these values:
- Light mode: #0d6efd
- Dark mode: #0dcaf0"

## Connection Management

### Establishing Connection

1. User enables MCP in plugin UI
2. Plugin UI creates WebSocket connection
3. Connection sends `join_channel` message
4. Server acknowledges connection
5. Plugin shows "Connected" status

### Handling Disconnection

1. WebSocket detects connection loss
2. Plugin UI updates status to "Disconnected"
3. Automatic reconnection attempt after 5 seconds
4. Maximum 3 reconnection attempts

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

ws.onclose = () => {
  if (reconnectAttempts < maxReconnectAttempts) {
    setTimeout(() => {
      reconnectAttempts++;
      connectMCPWebSocket(port, channel);
    }, 5000);
  }
};
```

### Manual Reconnection

User can manually reconnect by:
1. Disabling MCP toggle
2. Waiting 2 seconds
3. Re-enabling MCP toggle

## Error Handling

### Connection Errors

**Server Not Running:**

```javascript
ws.onerror = (error) => {
  console.error('Failed to connect to MCP server');
  showError('MCP server not available. Is figma-tokens-mcp running?');
};
```

**Wrong Port:**

```javascript
ws.onerror = (error) => {
  console.error('Connection refused on port ' + port);
  showError('Cannot connect on port ' + port + '. Check MCP server configuration.');
};
```

### Command Errors

**Invalid Collection ID:**

```json
{
  "error": "Collection not found",
  "collectionId": "invalid-id"
}
```

**Invalid Variable ID:**

```json
{
  "error": "Variable not found",
  "variableId": "invalid-id"
}
```

**Unknown Command:**

```json
{
  "error": "Unknown command",
  "command": "invalid_command"
}
```

## Security Considerations

### Localhost Only

The WebSocket server should only accept connections from localhost:

```javascript
server.listen(3055, 'localhost', () => {
  console.log('MCP server listening on localhost:3055');
});
```

### No Authentication

The current implementation does not include authentication. This is acceptable for local development but should be enhanced for production use.

### Command Validation

All MCP commands validate parameters before execution:

```javascript
if (!args.collectionId) {
  return { error: 'Missing required parameter: collectionId' };
}
```

## Performance Considerations

### Large Collections

For files with thousands of variables:
- `get_collections` is fast (only returns metadata)
- `get_collection` may take 1-2 seconds for large collections
- `export_theme` may take 3-5 seconds for multiple large collections

### Caching

Results can be cached in the AI client to reduce repeated queries:

```javascript
// Cache collection list
let cachedCollections = null;
let cacheTime = null;

function getCollections() {
  if (cachedCollections && Date.now() - cacheTime < 60000) {
    return cachedCollections;
  }
  
  cachedCollections = fetchCollections();
  cacheTime = Date.now();
  return cachedCollections;
}
```

### Connection Overhead

Each MCP command requires:
1. WebSocket message send
2. postMessage to plugin
3. Figma API calls
4. postMessage back to UI
5. WebSocket message receive

Total latency: 100-500ms depending on data size

## Best Practices

### AI Client Usage

1. Cache collection lists to reduce queries
2. Request specific collections instead of full exports
3. Filter results to relevant tokens only
4. Use descriptive prompts for better AI understanding

### Plugin Configuration

1. Keep MCP server running during AI interactions
2. Use default port unless conflicts occur
3. Monitor connection status
4. Disable when not using AI features

### Development Workflow

1. Start MCP server: `npx figma-tokens-mcp`
2. Configure AI client with server details
3. Enable MCP in plugin
4. Verify connection before making requests
5. Use natural language to query tokens

### Error Recovery

1. Check server is running if connection fails
2. Verify port configuration matches server
3. Restart plugin if messages stop flowing
4. Check browser console for WebSocket errors
