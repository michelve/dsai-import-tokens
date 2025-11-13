/**
 * Post-build script for esbuild compilation
 * Copies non-TypeScript files (HTML, manifest) to build directory
 * Note: code.js is already built by esbuild
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'build', 'dsai-import-tokens');
const SRC_DIR = path.join(__dirname, 'src');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy ui.html
const uiSource = path.join(SRC_DIR, 'ui.html');
const uiDest = path.join(BUILD_DIR, 'ui.html');
fs.copyFileSync(uiSource, uiDest);
console.log('✅ Copied: ui.html');

// Copy manifest.json
const manifestSource = path.join(__dirname, 'manifest.json');
const manifestDest = path.join(BUILD_DIR, 'manifest.json');
fs.copyFileSync(manifestSource, manifestDest);
console.log('✅ Copied: manifest.json');

console.log('✨ Build complete!');

