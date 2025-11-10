# HTTP Server API Reference

## Overview

The local HTTP server provides a REST API for receiving exported design tokens from the Figma plugin. It runs on localhost and saves received tokens to the file system for integration with external tools and workflows.

## Server Configuration

### Default Settings

- **Host:** `localhost`
- **Port:** `8947`
- **Protocol:** HTTP
- **CORS:** Enabled for all origins

### Starting the Server

```powershell
npm run server
```

Or manually:

```powershell
node scripts/local-server.js
```

Server output:

```
Local server running on http://localhost:8947
Try: http://localhost:8947/help
```

### Custom Port

Set custom port via environment variable:

```powershell
$env:PORT = 3000
node scripts/local-server.js
```

## API Endpoints

### GET /

**Description:** Returns server information and available endpoints.

**Response:**

```json
{
  "name": "DSAI Token Server",
  "status": "running",
  "endpoints": [
    "/",
    "/status",
    "/send-theme",
    "/send-collection",
    "/list",
    "/help"
  ]
}
```

**Status Code:** 200 OK

### GET /status

**Description:** Health check endpoint used by plugin to verify server connectivity.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** 200 OK

**Usage:**

The plugin tests this endpoint before enabling the remote connection feature. If the request fails or returns non-200 status, the connection is considered unavailable.

### POST /send-theme

**Description:** Receives complete theme data with all collections and saves to `theme.json`.

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "theme": {
    "Foundation": {
      "modes": {
        "Light": {
          "colors": {
            "primary": {
              "$value": "#0d6efd",
              "$type": "color"
            }
          }
        }
      }
    },
    "Components": {
      "modes": {
        "Light": {
          "button": {
            "background": {
              "$value": "{Foundation.colors.primary}",
              "$type": "color"
            }
          }
        }
      }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Theme saved successfully",
  "file": "theme.json",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** 200 OK

**Error Response:**

```json
{
  "success": false,
  "error": "Invalid theme data"
}
```

**Status Code:** 400 Bad Request

**File Output:**

Saved to: `scripts/received-tokens/theme.json`

The file is overwritten on each request, maintaining a single current theme file.

### POST /send-collection

**Description:** Receives a single collection and saves to a timestamped file.

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "collection": {
    "name": "Foundation",
    "data": {
      "modes": {
        "Light": {
          "colors": {
            "primary": {
              "$value": "#0d6efd",
              "$type": "color"
            }
          }
        }
      }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Collection saved successfully",
  "file": "Foundation_20240115_103000.json",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** 200 OK

**Error Response:**

```json
{
  "success": false,
  "error": "Invalid collection data"
}
```

**Status Code:** 400 Bad Request

**File Output:**

Saved to: `scripts/received-tokens/[CollectionName]_[YYYYMMDD]_[HHMMSS].json`

Example: `Foundation_20240115_103000.json`

Each collection export creates a new timestamped file, preserving history.

### GET /list

**Description:** Returns list of all received token files with metadata.

**Response:**

```json
{
  "files": [
    {
      "name": "theme.json",
      "size": 15234,
      "modified": "2024-01-15T10:30:00.000Z"
    },
    {
      "name": "Foundation_20240115_103000.json",
      "size": 8456,
      "modified": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 2,
  "directory": "received-tokens"
}
```

**Status Code:** 200 OK

**Error Response:**

```json
{
  "error": "Unable to read directory"
}
```

**Status Code:** 500 Internal Server Error

### GET /help

**Description:** Returns API documentation and usage instructions.

**Response:**

```json
{
  "name": "DSAI Token Server",
  "description": "Local HTTP server for receiving design tokens from Figma plugin",
  "endpoints": {
    "/": "Server information",
    "/status": "Health check",
    "/send-theme": "POST - Receive complete theme",
    "/send-collection": "POST - Receive single collection",
    "/list": "List received files",
    "/help": "This help message"
  },
  "usage": {
    "start": "npm run server",
    "test": "curl http://localhost:8947/status"
  }
}
```

**Status Code:** 200 OK

## Request/Response Flow

### Sending Theme from Plugin

```
Plugin (Figma)                    Server (localhost:8947)
      |                                    |
      | POST /send-theme                   |
      | Content-Type: application/json     |
      | Body: { theme: {...} }             |
      |---------------------------------->>|
      |                                    |
      |                   Validate request |
      |                    Parse JSON data |
      |              Save to theme.json    |
      |                                    |
      |<<----------------------------------|
      | 200 OK                             |
      | { success: true, file: "..." }    |
      |                                    |
```

### Testing Connection

```
Plugin (Figma)                    Server (localhost:8947)
      |                                    |
      | GET /status                        |
      |---------------------------------->>|
      |                                    |
      |                      Check health  |
      |                                    |
      |<<----------------------------------|
      | 200 OK                             |
      | { status: "ok", timestamp: "..." } |
      |                                    |
```

## File System Structure

### Output Directory

```
scripts/
  received-tokens/
    theme.json                          # Current complete theme
    Foundation_20240115_103000.json     # Collection snapshot
    Components_20240115_103500.json     # Collection snapshot
```

### File Naming

**Theme File:**

- Name: `theme.json`
- Overwritten on each POST to `/send-theme`
- Contains all collections

**Collection Files:**

- Name: `[CollectionName]_[YYYYMMDD]_[HHMMSS].json`
- New file created for each POST to `/send-collection`
- Timestamp format: YYYYMMDD_HHMMSS
- Example: `Foundation_20240115_103000.json`

### File Content Format

All files contain standard Design Tokens JSON:

```json
{
  "CollectionName": {
    "modes": {
      "ModeName": {
        "token": {
          "path": {
            "$value": "value",
            "$type": "type",
            "$description": "description",
            "$codeSyntax": {},
            "$scopes": [],
            "$extensions": {}
          }
        }
      }
    }
  }
}
```

## Integration Examples

### Plugin Integration

From Figma plugin Settings tab:

1. Enable "Remote Connection"
2. Keep default port 8947
3. Click "Send Theme to Server"

From plugin code:

```javascript
async function sendThemeToServer() {
  // Get all collections
  const collections = figma.variables.getLocalVariableCollections();
  
  // Process collections
  const allTokens = {};
  for (const collection of collections) {
    const variables = getAllVariables(collection);
    allTokens[collection.name] = processCollectionForExport(collection, variables);
  }
  
  // Send to server
  const response = await fetch('http://localhost:8947/send-theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: allTokens })
  });
  
  const result = await response.json();
  console.log(result.message);
}
```

### External Tool Integration

Reading received tokens:

```javascript
const fs = require('fs');
const path = require('path');

// Read theme file
const themePath = path.join(__dirname, 'received-tokens', 'theme.json');
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));

// Process tokens
for (const [collectionName, collection] of Object.entries(theme)) {
  console.log(`Collection: ${collectionName}`);
  
  for (const [modeName, tokens] of Object.entries(collection.modes)) {
    console.log(`  Mode: ${modeName}`);
    // Process tokens...
  }
}
```

### Build Pipeline Integration

```javascript
const fetch = require('node-fetch');
const fs = require('fs');

// Check server availability
async function checkServer() {
  try {
    const response = await fetch('http://localhost:8947/status');
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    return false;
  }
}

// Wait for theme update
async function waitForTheme() {
  const themePath = './received-tokens/theme.json';
  let lastModified = fs.statSync(themePath).mtime;
  
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const currentModified = fs.statSync(themePath).mtime;
      
      if (currentModified > lastModified) {
        clearInterval(interval);
        resolve(JSON.parse(fs.readFileSync(themePath, 'utf8')));
      }
    }, 1000);
  });
}

// Use in build
async function build() {
  console.log('Waiting for design tokens...');
  const theme = await waitForTheme();
  console.log('Tokens received, building...');
  // Process theme...
}
```

### Testing with cURL

Test connection:

```bash
curl http://localhost:8947/status
```

Send theme:

```bash
curl -X POST http://localhost:8947/send-theme \
  -H "Content-Type: application/json" \
  -d '{"theme":{"Foundation":{"modes":{"Light":{"colors":{"primary":{"$value":"#0d6efd","$type":"color"}}}}}}}'
```

List files:

```bash
curl http://localhost:8947/list
```

## Error Handling

### Connection Errors

**Server Not Running:**

```
Error: connect ECONNREFUSED 127.0.0.1:8947
```

Solution: Start the server with `npm run server`

**Wrong Port:**

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

Solution: Verify port configuration matches plugin settings

### Request Errors

**Missing Theme Data:**

```json
{
  "success": false,
  "error": "Missing theme data"
}
```

Solution: Ensure request body includes `theme` property

**Invalid JSON:**

```json
{
  "success": false,
  "error": "Invalid JSON"
}
```

Solution: Validate JSON syntax before sending

**Missing Collection Name:**

```json
{
  "success": false,
  "error": "Missing collection name"
}
```

Solution: Ensure collection object includes `name` property

### File System Errors

**Write Permission Denied:**

```
Error: EACCES: permission denied
```

Solution: Check file permissions on `received-tokens/` directory

**Disk Space:**

```
Error: ENOSPC: no space left on device
```

Solution: Free up disk space or change output directory

## CORS Configuration

The server enables CORS for all origins:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

This allows the Figma plugin to make cross-origin requests from the plugin iframe.

## Security Considerations

### Localhost Only

The server binds to `localhost` only and is not accessible from external networks. This is intentional for security.

### No Authentication

The server does not implement authentication. It should only be run in trusted local development environments.

### Input Validation

The server validates request bodies to prevent malformed data from being saved.

### File Overwrite Protection

Only `theme.json` is overwritten. Collection files use timestamps to prevent accidental overwrites.

## Performance

### Request Handling

- Asynchronous request processing
- Non-blocking I/O for file operations
- Minimal memory overhead

### File Size Limits

No explicit file size limits are enforced. Large token sets (>10MB) should work but may cause slowdowns.

### Concurrent Requests

The server handles one request at a time. Multiple simultaneous requests are queued.

## Best Practices

### Server Management

1. Start server before using plugin remote features
2. Keep server running during active development
3. Restart server if port conflicts occur

### File Management

1. Periodically clean up old timestamped files
2. Version control `theme.json` for tracking changes
3. Back up important token snapshots

### Integration

1. Poll `/status` endpoint to verify server availability
2. Handle connection errors gracefully
3. Validate received token files before processing

### Development Workflow

1. Start server: `npm run server`
2. Make changes in Figma
3. Send tokens from plugin
4. Process received files in build pipeline
5. Verify output
