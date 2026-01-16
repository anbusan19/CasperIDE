// GCP Compilation Service for CasperIDE
// This file should be placed on your GCP VM at: ~/casper-compiler-service/server.js

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const upload = multer();

// Enable CORS for all origins (restrict in production!)
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Casper compilation service is running",
        timestamp: new Date().toISOString()
    });
});

// Compilation endpoint
app.post("/compile", upload.single("source"), async (req, res) => {
    const startTime = Date.now();

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No source file provided" });
        }

        const code = req.file.buffer.toString("utf-8");
        const projectDir = `/tmp/casper_contract_${Date.now()}`;

        console.log(`[${new Date().toISOString()}] Starting compilation...`);
        console.log(`Project directory: ${projectDir}`);

        // Create Cargo project structure
        fs.mkdirSync(projectDir, { recursive: true });
        fs.mkdirSync(path.join(projectDir, "src"));

        // Cargo.toml for Casper contract - Using v3.0.0 with nightly-2024-10-01
        const cargoToml = `
[package]
name = "casper_contract"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = { version = "3.0.0", default-features = false }
casper-types = { version = "3.0.0", default-features = false }
wee_alloc = "0.4.5"

[profile.release]
lto = true
codegen-units = 1
opt-level = "z"

[lib]
crate-type = ["cdylib"]
    `.trim();

        fs.writeFileSync(path.join(projectDir, "Cargo.toml"), cargoToml);
        fs.writeFileSync(path.join(projectDir, "src", "lib.rs"), code);

        // Compile to WASM with pinned nightly toolchain
        const cmd = `cd ${projectDir} && cargo +nightly-2024-10-01 build --release --target wasm32-unknown-unknown 2>&1`;

        exec(cmd, { maxBuffer: 1024 * 1024 * 10, timeout: 300000 }, (error, stdout, stderr) => {
            const compilationTime = Date.now() - startTime;

            // Clean up function
            const cleanup = () => {
                try {
                    fs.rmSync(projectDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error("Cleanup error:", cleanupError);
                }
            };

            if (error) {
                console.error(`[${new Date().toISOString()}] Compilation failed (${compilationTime}ms)`);
                console.error("STDOUT:", stdout);
                console.error("STDERR:", stderr);
                console.error("ERROR:", error.message);
                cleanup();
                return res.status(400).json({
                    error: "Compilation failed",
                    details: stderr || stdout || error.message,
                    stdout: stdout,
                    stderr: stderr,
                    compilationTime: `${compilationTime}ms`
                });
            }

            const wasmPath = path.join(
                projectDir,
                "target",
                "wasm32-unknown-unknown",
                "release",
                "casper_contract.wasm"
            );

            if (!fs.existsSync(wasmPath)) {
                console.error(`[${new Date().toISOString()}] WASM file not found at: ${wasmPath}`);
                cleanup();
                return res.status(500).json({ error: "WASM file not found after compilation" });
            }

            let wasm = fs.readFileSync(wasmPath);
            const originalSize = wasm.length;

            console.log(`[${new Date().toISOString()}] ✓ Compilation successful!`);
            console.log(`Original WASM size: ${originalSize} bytes (${(originalSize / 1024).toFixed(2)} KB)`);

            // Optimize WASM with wasm-opt if available
            const optimizedPath = wasmPath.replace(".wasm", "_opt.wasm");
            const optimizeCmd = `wasm-opt -Oz ${wasmPath} -o ${optimizedPath} 2>&1`;

            try {
                require("child_process").execSync(optimizeCmd);
                if (fs.existsSync(optimizedPath)) {
                    wasm = fs.readFileSync(optimizedPath);
                    const optimizedSize = wasm.length;
                    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
                    console.log(`Optimized WASM size: ${optimizedSize} bytes (${(optimizedSize / 1024).toFixed(2)} KB)`);
                    console.log(`Size reduction: ${reduction}%`);
                }
            } catch (optError) {
                console.log(`⚠ wasm-opt not available, using unoptimized WASM`);
            }

            console.log(`Compilation time: ${compilationTime}ms`);

            // Send WASM binary
            res.setHeader("Content-Type", "application/wasm");
            res.setHeader("X-Compilation-Time", compilationTime.toString());
            res.setHeader("X-WASM-Size", wasm.length.toString());
            res.send(wasm);

            // Cleanup after sending response
            cleanup();
        });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Internal error:`, err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    // Get Rust version
    let rustVersion = "unknown";
    try {
        rustVersion = require("child_process").execSync("rustc +nightly-2024-10-01 --version", { encoding: "utf-8" }).trim();
    } catch (e) {
        rustVersion = "nightly-2024-10-01 (not installed)";
    }

    console.log("=".repeat(60));
    console.log("🚀 Casper Compilation Service");
    console.log("=".repeat(60));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ Compile endpoint: POST http://localhost:${PORT}/compile`);
    console.log(`✓ Started at: ${new Date().toISOString()}`);
    console.log(`✓ Rust version: ${rustVersion}`);
    console.log(`✓ Using casper-contract 3.0.0`);
    console.log("=".repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});
