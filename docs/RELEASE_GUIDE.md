# Release Guide - Automated Plugin Builds

## 🚀 Overview

This repository uses **GitHub Actions** to automatically build and release your Figma plugin whenever you create a new version tag.

---

## 📋 How It Works

### Workflow Trigger
The workflow runs automatically when you push a **version tag** like:
- `v1.0.0`
- `v2.1.3`
- `v1.5.0-beta`

### What It Does
1. ✅ **Checks out** your code
2. ✅ **Installs** dependencies (`npm ci`)
3. ✅ **Builds** the plugin (`npm run build`)
4. ✅ **Creates a ZIP** file of the built plugin
5. ✅ **Generates checksums** for verification
6. ✅ **Creates a GitHub Release** with automated notes
7. ✅ **Uploads assets** (ZIP + checksums)

---

## 🎯 How to Create a Release

### Step 1: Prepare Your Release

```bash
# Make sure all your changes are committed
git add .
git commit -m "feat: Add collection selector feature"
git push origin main
```

### Step 2: Create and Push a Version Tag

```bash
# Create a tag (e.g., v1.0.0, v1.1.0, v2.0.0)
git tag v1.0.0

# Push the tag to GitHub
git push origin v1.0.0
```

### Step 3: Watch the Magic Happen ✨

1. Go to **GitHub → Actions tab**
2. See the workflow running: `Build and Release Figma Plugin`
3. Wait ~1-2 minutes for build to complete
4. Go to **GitHub → Releases**
5. Your new release is there with the plugin ZIP attached!

---

## 📦 What Gets Released

Your GitHub Release will include:

### 1. Plugin ZIP File
```
dsai-import-tokens-v1.0.0.zip
├── dsai-import-tokens/
│   ├── code.js (compiled TypeScript)
│   ├── ui.html (UI with all styles)
│   └── manifest.json (plugin configuration)
```

### 2. Checksums File
```
checksums.txt
└── SHA256 hash for ZIP file verification
```

### 3. Automated Release Notes
- Installation instructions
- What's included
- Checksum verification
- Links to documentation

---

## 🏷️ Version Tag Format

### Semantic Versioning (Recommended)

Follow [semver](https://semver.org/) format: `vMAJOR.MINOR.PATCH`

```bash
# Major release (breaking changes)
git tag v2.0.0

# Minor release (new features)
git tag v1.1.0

# Patch release (bug fixes)
git tag v1.0.1
```

### Pre-release Tags

```bash
# Beta releases
git tag v1.0.0-beta.1
git tag v1.0.0-beta.2

# Release candidates
git tag v1.0.0-rc.1

# Alpha releases
git tag v1.0.0-alpha.1
```

---

## 📝 Complete Release Workflow Example

### Scenario: Release Version 1.2.0

```bash
# 1. Finish your feature
git add .
git commit -m "feat: Add collection selector for separate file exports"
git push origin main

# 2. Update version in package.json (optional but recommended)
# Edit package.json: "version": "1.2.0"
git add package.json
git commit -m "chore: Bump version to 1.2.0"
git push origin main

# 3. Create and push the tag
git tag v1.2.0
git push origin v1.2.0

# 4. Wait for GitHub Actions to complete
# Check: https://github.com/YOUR_USERNAME/dsai-import-tokens/actions

# 5. Release is ready!
# Download: https://github.com/YOUR_USERNAME/dsai-import-tokens/releases/tag/v1.2.0
```

---

## 🔍 Monitoring Builds

### View Build Status

**Option 1: GitHub Actions Tab**
```
GitHub → Your Repo → Actions → Build and Release Figma Plugin
```

**Option 2: Release Badge** (add to README.md)
```markdown
![Release](https://github.com/YOUR_USERNAME/dsai-import-tokens/actions/workflows/release.yml/badge.svg)
```

### Build Logs

Click on any workflow run to see:
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Build plugin
- ✅ Create ZIP
- ✅ Upload to release

---

## 🐛 Troubleshooting

### Build Fails

**Check the logs:**
1. Go to **Actions** tab
2. Click the failed workflow run
3. Expand the failed step
4. Read the error message

**Common issues:**

#### TypeScript Errors
```bash
# Fix locally first
npm run typecheck
npm run lint
npm run build

# Then push and re-tag
```

#### Dependency Issues
```bash
# Update package-lock.json
npm install
git add package-lock.json
git commit -m "chore: Update dependencies"
git push origin main
```

#### Tag Already Exists
```bash
# Delete the tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Create a new commit, then re-tag
git tag v1.0.0
git push origin v1.0.0
```

---

## 🎨 Customizing the Release

### Edit Release Notes

You can edit the release notes after creation:

1. Go to **Releases**
2. Click **Edit** on your release
3. Modify the description
4. Click **Update release**

### Add More Assets

To add additional files to releases, edit `.github/workflows/release.yml`:

```yaml
- name: Upload Additional Asset
  uses: actions/upload-release-asset@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    upload_url: ${{ steps.create_release.outputs.upload_url }}
    asset_path: ./your-file.txt
    asset_name: your-file.txt
    asset_content_type: text/plain
```

---

## 📊 Release Checklist

Before creating a release, verify:

- [ ] All features are tested and working
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Plugin works in Figma Desktop
- [ ] Version number follows semver
- [ ] CHANGELOG.md is updated (optional)
- [ ] Documentation is up to date

---

## 🔐 Security & Permissions

### Required GitHub Permissions

The workflow needs:
- ✅ **Contents: write** - To create releases and upload assets
- ✅ **GITHUB_TOKEN** - Automatically provided by GitHub Actions

### No Secrets Required

This workflow uses the built-in `GITHUB_TOKEN` - no manual configuration needed!

---

## 🚀 Advanced Usage

### Automatic Version Bumping

Add this to `package.json`:

```json
{
  "scripts": {
    "release:patch": "npm version patch && git push --follow-tags",
    "release:minor": "npm version minor && git push --follow-tags",
    "release:major": "npm version major && git push --follow-tags"
  }
}
```

Usage:
```bash
# Automatically bump version and create tag
npm run release:patch  # 1.0.0 → 1.0.1
npm run release:minor  # 1.0.1 → 1.1.0
npm run release:major  # 1.1.0 → 2.0.0
```

### Draft Releases

To create draft releases (manual approval before publishing):

Edit `.github/workflows/release.yml`:
```yaml
draft: true  # Change from false to true
```

### Pre-release Tagging

For beta/alpha releases, modify the workflow:

```yaml
prerelease: ${{ contains(github.ref_name, 'beta') || contains(github.ref_name, 'alpha') }}
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)

---

## ✅ Quick Reference

### Create Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Delete Tag (if mistake)
```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### List All Tags
```bash
git tag -l
```

### View Tag Details
```bash
git show v1.0.0
```

---

## 🎉 You're All Set!

Your automated release pipeline is ready. Every time you push a version tag, GitHub Actions will:

1. ✅ Build your plugin
2. ✅ Create a release
3. ✅ Attach the ZIP file
4. ✅ Generate checksums
5. ✅ Add automated release notes

**Just push a tag and let automation handle the rest!** 🚀

