#!/usr/bin/env node

/**
 * Local server for receiving design tokens from Figma plugin
 * Run this on your machine to listen for token data from the plugin
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8947; // Default port
const OUTPUT_DIR = path.join(process.cwd(), 'received-tokens');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS for Figma plugin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle GET requests
  if (req.method === 'GET') {
    if (req.url === '/' || req.url === '/status') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        message: 'DSAI Token Receiver is running',
        port: PORT,
        outputDir: OUTPUT_DIR,
        endpoints: {
          '/status': 'Check server status',
          '/send-theme': 'POST - Receive complete theme.json',
          '/send-collection': 'POST - Receive single collection',
          '/list': 'GET - List received files'
        }
      }, null, 2));
      return;
    }

    if (req.url === '/list') {
      try {
        const files = fs.readdirSync(OUTPUT_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => ({
            name: f,
            path: path.join(OUTPUT_DIR, f),
            size: fs.statSync(path.join(OUTPUT_DIR, f)).size,
            modified: fs.statSync(path.join(OUTPUT_DIR, f)).mtime
          }));
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          count: files.length,
          files: files
        }, null, 2));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
      return;
    }
  }

  // Handle POST requests
  if (req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        if (req.url === '/send-theme') {
          handleSendTheme(data, res);
        } else if (req.url === '/send-collection') {
          handleSendCollection(data, res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Unknown endpoint'
          }));
        }
      } catch (error) {
        console.error('❌ Error processing request:', error);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });

    return;
  }

  // Unknown route
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found'
  }));
});

/**
 * Handle receiving complete theme
 */
function handleSendTheme(data, res) {
  const filename = `theme.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Received theme: ${filename}`);
    console.log(`   Collections: ${Object.keys(data).filter(k => k !== 'metadata').length}`);
    console.log(`   Saved to: ${filepath}`);

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Theme received successfully',
      filename: filename,
      path: filepath
    }));
  } catch (error) {
    console.error('❌ Failed to save theme:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

/**
 * Handle receiving single collection
 */
function handleSendCollection(data, res) {
  const collectionName = data.collectionName || 'collection';
  const sanitizedName = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${sanitizedName}-${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(data.tokens || data, null, 2));
    
    console.log(`✅ Received collection: ${collectionName}`);
    console.log(`   Saved as: ${filename}`);
    console.log(`   Path: ${filepath}`);

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Collection received successfully',
      filename: filename,
      path: filepath
    }));
  } catch (error) {
    console.error('❌ Failed to save collection:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('🚀 DSAI Token Receiver Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log('');
  console.log('✨ Ready to receive tokens from Figma!');
  console.log('');
  console.log('💡 In Figma plugin:');
  console.log('   1. Go to Settings tab');
  console.log('   2. Enable "Send to Local Server"');
  console.log('   3. Click "Send Theme" or "Send Collection"');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   Try closing other applications or use a different port.');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
