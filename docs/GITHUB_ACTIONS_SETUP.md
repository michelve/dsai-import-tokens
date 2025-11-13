# GitHub Actions Setup Guide

## 🤖 Automated Plugin Releases

Your repository is now configured with automated builds and releases using GitHub Actions!

---

## 📁 Workflow File

**Location:** `.github/workflows/release.yml`

This workflow automatically:
1. Builds your Figma plugin
2. Creates a ZIP file
3. Generates checksums
4. Creates a GitHub Release
5. Attaches build artifacts

---

## 🚀 Quick Start

### Create Your First Release

```bash
# 1. Make sure everything is committed
git add .
git commit -m "feat: Ready for first release"
git push origin main

# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# 3. Watch the action run
# Go to: https://github.com/YOUR_USERNAME/dsai-import-tokens/actions

# 4. Download your release
# Go to: https://github.com/YOUR_USERNAME/dsai-import-tokens/releases
```

---

## 📋 What Gets Built

### Input (Source Code)
```
/Users/michel/GitHub/dsai-import-tokens/
├── src/
│   ├── main.ts
│   ├── import.ts
│   ├── export.ts
│   ├── utils.ts
│   ├── server.ts
│   ├── types.ts
│   └── ui.html
├── manifest.json
└── package.json
```

### Output (Built Plugin)
```
dsai-import-tokens-v1.0.0.zip
└── dsai-import-tokens/
    ├── code.js (54.9kb - TypeScript compiled)
    ├── ui.html (Complete UI with styles)
    └── manifest.json (Plugin config)
```

---

## 🔧 Workflow Details

### Triggers
```yaml
on:
  push:
    tags:
      - 'v*.*.*'  # Any tag starting with 'v'
```

**Examples of valid tags:**
- ✅ `v1.0.0`
- ✅ `v2.1.5`
- ✅ `v1.0.0-beta.1`
- ❌ `1.0.0` (missing 'v' prefix)
- ❌ `version-1.0.0` (wrong format)

### Build Steps

1. **Checkout Code**
   ```yaml
   - uses: actions/checkout@v4
   ```

2. **Setup Node.js 18**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '18'
       cache: 'npm'
   ```

3. **Install Dependencies**
   ```bash
   npm ci  # Clean install (faster than npm install)
   ```

4. **Build Plugin**
   ```bash
   npm run build  # Runs your build scripts
   ```

5. **Create ZIP**
   ```bash
   cd build
   zip -r ../dsai-import-tokens-vX.X.X.zip dsai-import-tokens
   ```

6. **Generate Checksums**
   ```bash
   sha256sum dsai-import-tokens-vX.X.X.zip > checksums.txt
   ```

7. **Create Release + Upload Assets**
   - Uses GitHub's API to create release
   - Attaches ZIP file
   - Attaches checksums
   - Generates automated release notes

---

## 📊 Build Status

### View Build Logs

1. Go to **GitHub → Actions** tab
2. Click on the workflow run
3. Expand each step to see details

### Success Output
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Build plugin
✅ Get version from tag
✅ Create plugin zip
✅ Generate checksums
✅ Create Release
✅ Upload Release Asset (ZIP)
✅ Upload Checksums
✅ Build Success Notification
```

---

## 🎯 Release Naming Convention

The workflow automatically creates releases with this format:

```
Release Name: DSAi Import Tokens v1.0.0
Tag: v1.0.0
Asset: dsai-import-tokens-v1.0.0.zip
```

---

## 🔐 Permissions

### Required (Automatic)

The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub.

**Permissions requested:**
```yaml
permissions:
  contents: write  # To create releases and upload assets
```

### No Manual Setup Needed!

GitHub automatically provides the token with appropriate permissions. You don't need to:
- ❌ Create any secrets
- ❌ Configure tokens
- ❌ Set up credentials

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to create release - Release already exists"

**Cause:** You pushed a tag that already has a release.

**Solution:**
```bash
# Delete the tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Delete the release on GitHub (manually in UI)
# Then re-tag with new version
git tag v1.0.1
git push origin v1.0.1
```

### Issue: "Build failed - TypeScript errors"

**Cause:** TypeScript compilation errors.

**Solution:**
```bash
# Test locally first
npm run typecheck
npm run lint
npm run build

# Fix errors, then commit and re-tag
git add .
git commit -m "fix: Resolve TypeScript errors"
git push origin main
git tag v1.0.1
git push origin v1.0.1
```

### Issue: "Node modules not found"

**Cause:** Dependency installation failed.

**Solution:**
```bash
# Make sure package-lock.json is committed
git add package-lock.json
git commit -m "chore: Add package-lock.json"
git push origin main
```

### Issue: "Permission denied"

**Cause:** Workflow doesn't have write permissions.

**Solution:**
1. Go to **Settings → Actions → General**
2. Under "Workflow permissions"
3. Select "Read and write permissions"
4. Click **Save**

---

## 🎨 Customization

### Change Node Version

Edit `.github/workflows/release.yml`:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change from 18 to 20
```

### Add Build Notifications

Add Slack/Discord webhooks:
```yaml
- name: Notify Success
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Plugin v${{ steps.get_version.outputs.VERSION }} released!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Run Tests Before Release

Add before the build step:
```yaml
- name: Run Tests
  run: npm test
```

---

## 📈 Workflow Performance

**Typical build times:**
- **Checkout:** ~5 seconds
- **Setup Node:** ~10 seconds
- **Install dependencies:** ~20 seconds
- **Build:** ~2 seconds
- **Create ZIP:** ~1 second
- **Create release:** ~5 seconds

**Total:** ~45-60 seconds per release ⚡

---

## ✅ Testing the Workflow

### Test Without Creating a Release

You can test the build process without creating a release:

```yaml
# Add to workflow for testing
on:
  pull_request:
    branches: [main]
  push:
    tags:
      - 'v*.*.*'
```

This runs the build on PRs but only creates releases on tags.

---

## 📚 Next Steps

1. ✅ **Workflow is configured** - `.github/workflows/release.yml`
2. ✅ **Ready to use** - Just push a tag!
3. 📖 **Read full guide** - See `RELEASE_GUIDE.md`
4. 🚀 **Create first release** - `git tag v1.0.0 && git push origin v1.0.0`

---

## 🎉 Summary

Your automated release pipeline:

- ✅ **Triggers:** On version tag push
- ✅ **Builds:** Complete plugin with TypeScript compilation
- ✅ **Packages:** Creates production-ready ZIP
- ✅ **Secures:** Generates SHA256 checksums
- ✅ **Releases:** Automatic GitHub release with notes
- ✅ **Speed:** ~1 minute per release
- ✅ **Zero config:** No secrets or manual setup needed

**Just push a tag and your plugin is automatically built and released!** 🚀

