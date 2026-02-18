/**
 * Create a zip file of the build directory for distribution
 * Using archiver package for cross-platform zip creation
 */

const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "build", "dsai-import-tokens");
const OUTPUT_ZIP = path.join(__dirname, "build", "dsai-import-tokens.zip");

async function createZipWithArchiver() {
	try {
		// Try to load archiver (if available)
		const archiver = require("archiver");

		// Check if build directory exists
		if (!fs.existsSync(BUILD_DIR)) {
			console.error('❌ Build directory not found. Run "npm run build" first.');
			process.exit(1);
		}

		// Remove old zip if it exists
		if (fs.existsSync(OUTPUT_ZIP)) {
			fs.unlinkSync(OUTPUT_ZIP);
			console.log("🗑️  Removed old zip file");
		}

		console.log("📦 Creating zip archive...");

		// Create write stream
		const output = fs.createWriteStream(OUTPUT_ZIP);
		const archive = archiver("zip", { zlib: { level: 9 } });

		// Listen for completion
		output.on("close", () => {
			const fileSizeInKB = (archive.pointer() / 1024).toFixed(1);
			console.log(
				`✅ Zip created: build/dsai-import-tokens.zip (${fileSizeInKB} KB)`,
			);
		});

		// Handle errors
		archive.on("error", (err) => {
			throw err;
		});

		// Pipe archive to file
		archive.pipe(output);

		// Add the build directory contents
		archive.directory(BUILD_DIR, "dsai-import-tokens");

		// Finalize the archive
		await archive.finalize();
	} catch (error) {
		if (error.code === "MODULE_NOT_FOUND") {
			console.log("⚠️  archiver package not found. Installing...");
			const { execSync } = require("child_process");
			execSync("npm install archiver --save-dev", { stdio: "inherit" });
			console.log("✅ archiver installed. Re-running zip creation...");
			// Retry
			return createZipWithArchiver();
		} else {
			console.error("❌ Failed to create zip:", error.message);
			process.exit(1);
		}
	}
}

createZipWithArchiver();
