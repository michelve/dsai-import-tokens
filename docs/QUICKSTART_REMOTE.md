# Quick Start: Send Tokens to Local Machine

## Step 1: Start the Local Server

Open a terminal in your project directory and run:

```powershell
npm run server
```

Or directly:

```powershell
node scripts/local-server.js
```

You should see:

```
Server running on http://localhost:8947
Received files will be saved to: scripts/received-tokens
```

## Step 2: Connect from Figma Plugin

1. Open your Figma file
2. Run the plugin (Plugins → DSAI Import Tokens)
3. Go to the **Settings** tab
4. Toggle **"Connect to Local Server"** ON
5. You should see: `Connected to localhost:8947`

## Step 3: Send Your Tokens

Click **"Send Theme to Server"** button in the Settings tab

Your theme will be saved to:
```
scripts/received-tokens/theme.json
```

Individual collections can also be sent and will be saved with timestamps:
```
scripts/received-tokens/collection-[name]-[timestamp].json
```

## Received Files

Files are saved in `scripts/received-tokens/`:
- `theme.json` - Complete theme (no timestamp, overwrites on each send)
- `collection-[name]-[timestamp].json` - Individual collections with timestamps

## Test the Server

Check if the server is running:

```powershell
Invoke-RestMethod -Uri "http://localhost:8947/status" -Method GET | ConvertTo-Json
```

List received files:

```powershell
Invoke-RestMethod -Uri "http://localhost:8947/list" -Method GET | ConvertTo-Json
```

## Troubleshooting

### "Cannot connect to local server"

- Make sure `scripts/local-server.js` is running
- Check the port number matches (default: 8947)
- Try restarting the server

### "Port already in use"

- Another application is using port 8947
- Change the port in both:
  - Figma plugin Settings
  - Restart `scripts/local-server.js` with custom port

### Change Port

Edit `scripts/local-server.js` line with PORT constant:

```javascript
const PORT = 9000; // Change to your port
```

Then restart the server.

## Next Steps

### Watch for Changes (VSCode)

Install a file watcher extension in VSCode to auto-reload when tokens arrive.

### Auto-Import to Project

Create a script to watch the `scripts/received-tokens` folder and copy files to your project:

```powershell
# watch-tokens.ps1
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "scripts/received-tokens"
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

```text
dsai-import-tokens/
├── scripts/
│   ├── local-server.js      # Run this!
│   └── received-tokens/     # Tokens saved here
│       ├── theme.json
│       └── collection-*.json
└── ...
```
