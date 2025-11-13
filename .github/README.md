# GitHub Workflows

This directory contains automated workflows for the DSAi Import Tokens plugin.

---

## 📁 Workflows

### `release.yml` - Automated Plugin Releases

**Trigger:** Push version tag (e.g., `v1.0.0`)

**What it does:**
1. Builds the Figma plugin from TypeScript source
2. Creates a ZIP file of the built plugin
3. Generates SHA256 checksums for verification
4. Creates a GitHub Release with automated notes
5. Uploads the ZIP and checksums as release assets

**Usage:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Output:**
- `dsai-import-tokens-v1.0.0.zip` - Production-ready plugin
- `checksums.txt` - SHA256 hash for verification
- GitHub Release with installation instructions

---

## 📚 Documentation

- **Setup Guide:** `../docs/GITHUB_ACTIONS_SETUP.md`
- **Release Guide:** `../RELEASE_GUIDE.md`

---

## 🚀 Quick Start

```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0

# View build status
# GitHub → Actions → Build and Release Figma Plugin

# Download release
# GitHub → Releases → Latest
```

---

## ⚙️ Requirements

- Node.js 18+
- npm dependencies in `package.json`
- Build scripts in `package.json`

---

## 🔐 Permissions

Uses `GITHUB_TOKEN` (automatic) with:
- `contents: write` - Create releases and upload assets

No manual configuration needed!

---

## 📊 Build Time

~45-60 seconds per release

---

## ✅ Status

![Release Workflow](https://github.com/michelve/dsai-import-tokens/actions/workflows/release.yml/badge.svg)

