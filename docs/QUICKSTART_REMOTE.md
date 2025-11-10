# Quick Start: Send Tokens to Local Machine

## Step 1: Start the Local Server

Open a terminal in your project directory and run:

```powershell
npm run server
```

Or directly:

```powershell
node local-server.js
```

You should see:

```
🚀 DSAI Token Receiver Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Listening on: http://localhost:8947
📁 Output directory: E:\GitHub\dsai-import-tokens\received-tokens
```

## Step 2: Connect from Figma Plugin

1. Open your Figma file
2. Run the plugin (Plugins → DSAI Import Tokens)
3. Go to the **Settings** tab
4. Toggle **"Connect to Local Server"** ON
5. You should see: `✓ Connected to localhost:8947`

## Step 3: Send Your Tokens

Click **"Send All Collections"** button

Your tokens will be saved to:
```
E:\GitHub\dsai-import-tokens\received-tokens\theme-[timestamp].json
```

## Received Files

All received files are saved with timestamps:
- `theme-2025-11-10T14-30-45.json`
- `colors-2025-11-10T14-31-20.json`

## Test the Server

Check if the server is running:

```powershell
Invoke-RestMethod -Uri "http://localhost:8947/status" -Method GET | ConvertTo-Json
```

## Troubleshooting

### "Cannot connect to local server"
- Make sure `local-server.js` is running
- Check the port number matches (default: 8947)
- Try restarting the server

### "Port already in use"
- Another application is using port 8947
- Change the port in both:
  - Figma plugin Settings
  - Restart local-server.js with custom port

### Change Port

Edit `local-server.js` line 10:
```javascript
const PORT = 9000; // Change to your port
```

Then restart the server.

## Next Steps

### Watch for Changes (VSCode)

Install a file watcher extension in VSCode to auto-reload when tokens arrive.

### Auto-Import to Project

Create a script to watch the `received-tokens` folder and copy files to your project:

```powershell
# watch-tokens.ps1
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "received-tokens"
$watcher.Filter = "*.json"
$watcher.EnableRaisingEvents = $true

Register-ObjectEvent $watcher "Created" -Action {
    $file = $Event.SourceEventArgs.FullPath
    Write-Host "New tokens received: $file"
    Copy-Item $file "src/theme/"
}

while ($true) { Start-Sleep 1 }
```

## Files Created

```
dsai-import-tokens/
├── local-server.js          # 👈 Run this!
├── received-tokens/         # 👈 Tokens saved here
│   ├── theme-*.json
│   └── collection-*.json
└── ...
```
