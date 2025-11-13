# First Release Checklist

Before creating your first automated release, complete these steps:

---

## ✅ Pre-Release Checklist

### 1. Repository Setup

- [ ] Commit all your changes
  ```bash
  git add .
  git commit -m "chore: Prepare for first release"
  git push origin main
  ```

- [ ] Ensure `.github/workflows/release.yml` exists
  ```bash
  ls -la .github/workflows/release.yml
  ```

### 2. GitHub Permissions

- [ ] Go to **GitHub → Settings → Actions → General**
- [ ] Under "Workflow permissions"
- [ ] Select **"Read and write permissions"**
- [ ] Click **Save**

### 3. Test Local Build

- [ ] Install dependencies
  ```bash
  npm install
  ```

- [ ] Run TypeScript check
  ```bash
  npm run typecheck
  ```

- [ ] Run linter
  ```bash
  npm run lint
  ```

- [ ] Test build
  ```bash
  npm run build
  ```

- [ ] Verify build output
  ```bash
  ls -la build/dsai-import-tokens/
  # Should see: code.js, ui.html, manifest.json
  ```

### 4. Test Plugin in Figma

- [ ] Open Figma Desktop
- [ ] **Plugins → Development → Import plugin from manifest**
- [ ] Select `build/dsai-import-tokens/manifest.json`
- [ ] Test all features:
  - [ ] Import tokens
  - [ ] Export tokens (single file)
  - [ ] Export tokens (separate files)
  - [ ] Collection selector
  - [ ] Preview
  - [ ] Settings

---

## 🚀 Create First Release

### Step 1: Choose Version Number

Follow [Semantic Versioning](https://semver.org/):
- **v1.0.0** - First stable release
- **v0.1.0** - Beta/initial development
- **v1.0.0-beta.1** - Pre-release

### Step 2: Create and Push Tag

```bash
# Create the tag
git tag v1.0.0

# Verify the tag
git tag -l

# Push the tag to GitHub
git push origin v1.0.0
```

### Step 3: Monitor the Build

1. Go to **GitHub → Actions** tab
2. Click on "Build and Release Figma Plugin"
3. Watch the workflow run (~1 minute)
4. Verify all steps complete successfully ✅

### Step 4: Verify the Release

1. Go to **GitHub → Releases**
2. You should see:
   - Release title: "DSAi Import Tokens v1.0.0"
   - Assets: `dsai-import-tokens-v1.0.0.zip` + `checksums.txt`
   - Automated release notes

### Step 5: Test the Release

```bash
# Download the ZIP from GitHub Releases
# Extract it
unzip dsai-import-tokens-v1.0.0.zip

# Import into Figma
# Figma → Plugins → Development → Import plugin from manifest
# Select dsai-import-tokens/manifest.json from extracted folder

# Test the plugin works exactly like your local build
```

---

## 🐛 Troubleshooting

### Build Fails - "Permission denied"

**Solution:**
1. GitHub → Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. Save and re-run the workflow

### Build Fails - "TypeScript errors"

**Solution:**
```bash
# Fix errors locally first
npm run typecheck
npm run lint
npm run build

# Commit fixes
git add .
git commit -m "fix: Resolve build errors"
git push origin main

# Delete old tag and create new one
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag v1.0.0
git push origin v1.0.0
```

### Release Already Exists

**Solution:**
```bash
# Delete the tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Manually delete the release on GitHub
# (Go to Releases → Edit → Delete)

# Use a new version number
git tag v1.0.1
git push origin v1.0.1
```

---

## 📚 After First Release

### Update README.md

Add release badge to your README:

```markdown
![Release](https://github.com/michelve/dsai-import-tokens/actions/workflows/release.yml/badge.svg)
```

### Share the Release

- 🔗 Share the GitHub Release URL
- 📦 Users can download the ZIP directly
- ✅ All builds are verified with checksums

### Future Releases

Just repeat Step 2-4 with new version numbers:

```bash
# Bug fix release
git tag v1.0.1
git push origin v1.0.1

# New feature release
git tag v1.1.0
git push origin v1.1.0

# Major update
git tag v2.0.0
git push origin v2.0.0
```

---

## ✅ You're Done!

Your automated release pipeline is now active. Every time you push a version tag:

1. ✅ GitHub Actions builds your plugin
2. ✅ Creates a production-ready ZIP
3. ✅ Generates checksums
4. ✅ Creates a GitHub Release
5. ✅ Attaches all assets

**No manual building or packaging required!** 🎉

---

## 📖 More Information

- **Detailed Guide:** See `RELEASE_GUIDE.md`
- **Setup Guide:** See `docs/GITHUB_ACTIONS_SETUP.md`
- **Workflow File:** `.github/workflows/release.yml`

