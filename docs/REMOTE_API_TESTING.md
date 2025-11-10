# Testing Remote Connection API

## Prerequisites
1. Open the plugin in Figma
2. Go to the **Settings** tab
3. Enable **Remote Connection** toggle
4. Note the port number (default: 8947)
5. Verify you see "✓ Server running on port 8947"

## PowerShell Testing Commands

### 1. Test Help/Documentation
```powershell
Invoke-RestMethod -Uri "http://localhost:8947/help" -Method GET | ConvertTo-Json -Depth 10
```

### 2. List All Collections
```powershell
Invoke-RestMethod -Uri "http://localhost:8947/collections" -Method GET | ConvertTo-Json -Depth 10
```

### 3. Get Specific Collection
```powershell
# Replace "Colors" with your actual collection name
Invoke-RestMethod -Uri "http://localhost:8947/collection/Colors" -Method GET | ConvertTo-Json -Depth 10
```

### 4. Get as Theme File
```powershell
Invoke-RestMethod -Uri "http://localhost:8947/file/theme" -Method GET | ConvertTo-Json -Depth 10
```

### 5. Save Response to File
```powershell
# Save collections list to file
Invoke-RestMethod -Uri "http://localhost:8947/collections" -Method GET | ConvertTo-Json -Depth 10 | Out-File -FilePath "collections.json"

# Save specific collection to file
Invoke-RestMethod -Uri "http://localhost:8947/collection/Colors" -Method GET | ConvertTo-Json -Depth 10 | Out-File -FilePath "colors.json"

# Save complete theme
Invoke-RestMethod -Uri "http://localhost:8947/file/theme" -Method GET | ConvertTo-Json -Depth 10 | Out-File -FilePath "theme.json"
```

## Alternative: Using curl (if installed)

### 1. Test Help
```bash
curl http://localhost:8947/help
```

### 2. List Collections (formatted)
```bash
curl http://localhost:8947/collections | jq .
```

### 3. Get Specific Collection
```bash
curl http://localhost:8947/collection/Colors | jq .
```

### 4. Get Theme File
```bash
curl http://localhost:8947/file/theme | jq .
```

### 5. Save to File
```bash
curl http://localhost:8947/collections -o collections.json
curl http://localhost:8947/collection/Colors -o colors.json
curl http://localhost:8947/file/theme -o theme.json
```

## Testing with Different Ports

If you changed the port to something other than 8947, update the URL:

```powershell
# Example with port 9000
Invoke-RestMethod -Uri "http://localhost:9000/collections" -Method GET | ConvertTo-Json -Depth 10
```

## Quick Test Script

Save this as `test-api.ps1`:

```powershell
# Test Remote Connection API
$port = 8947
$baseUrl = "http://localhost:$port"

Write-Host "Testing DSAI Import Tokens Remote API on port $port" -ForegroundColor Cyan
Write-Host ""

# Test 1: Help
Write-Host "1. Testing /help endpoint..." -ForegroundColor Yellow
try {
    $help = Invoke-RestMethod -Uri "$baseUrl/help" -Method GET
    Write-Host "✓ Help endpoint working" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Help endpoint failed: $_" -ForegroundColor Red
    exit
}

# Test 2: Collections
Write-Host "2. Testing /collections endpoint..." -ForegroundColor Yellow
try {
    $collections = Invoke-RestMethod -Uri "$baseUrl/collections" -Method GET
    Write-Host "✓ Collections endpoint working" -ForegroundColor Green
    Write-Host "  Found $($collections.count) collections:" -ForegroundColor Cyan
    foreach ($col in $collections.collections) {
        Write-Host "    - $($col.name) ($($col.variableIds) variables)" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "✗ Collections endpoint failed: $_" -ForegroundColor Red
    exit
}

# Test 3: Get First Collection
if ($collections.collections.Count -gt 0) {
    $firstCollection = $collections.collections[0].name
    Write-Host "3. Testing /collection/$firstCollection endpoint..." -ForegroundColor Yellow
    try {
        $collectionData = Invoke-RestMethod -Uri "$baseUrl/collection/$firstCollection" -Method GET
        Write-Host "✓ Collection endpoint working" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "✗ Collection endpoint failed: $_" -ForegroundColor Red
    }
}

# Test 4: Get Theme File
Write-Host "4. Testing /file/theme endpoint..." -ForegroundColor Yellow
try {
    $theme = Invoke-RestMethod -Uri "$baseUrl/file/theme" -Method GET
    Write-Host "✓ File endpoint working" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ File endpoint failed: $_" -ForegroundColor Red
}

Write-Host "All tests completed!" -ForegroundColor Cyan
```

Run it with:
```powershell
.\test-api.ps1
```

## Troubleshooting

### Server not responding
- Check that the plugin is open in Figma
- Verify the server toggle is enabled in Settings
- Confirm the port number matches
- Try restarting the server (toggle off then on)

### Connection refused
- Make sure Figma is running
- Check that no other application is using the same port
- Try a different port (8000-9999)

### Empty collections
- Ensure you have variable collections in your Figma file
- Create some variables in Figma first
- Refresh the plugin

## Example Use Cases

### VSCode Extension Integration
```javascript
// Fetch collections from Figma
const response = await fetch('http://localhost:8947/collections');
const data = await response.json();
console.log('Available collections:', data.collections);
```

### Save All Collections Script
```powershell
# Save each collection to separate files
$collections = Invoke-RestMethod -Uri "http://localhost:8947/collections" -Method GET

foreach ($col in $collections.collections) {
    $name = $col.name -replace '\s+', '-'
    $filename = "$name.json"
    Write-Host "Saving $filename..."
    Invoke-RestMethod -Uri "http://localhost:8947/collection/$($col.name)" -Method GET | ConvertTo-Json -Depth 10 | Out-File -FilePath $filename
}

Write-Host "Done! Saved $($collections.count) collections"
```
