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

        // Cargo.toml for Casper contract - USING STABLE VERSIONS
        const cargoToml = `
[package]
name = "casper_contract"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = "1.4.4"
casper-types = "1.5.0"

[lib]
crate-type = ["cdylib"]
    `.trim();

        fs.writeFileSync(path.join(projectDir, "Cargo.toml"), cargoToml);
        fs.writeFileSync(path.join(projectDir, "src", "lib.rs"), code);

        // Compile to WASM with increased timeout
        const cmd = `cd ${projectDir} && cargo build --release --target wasm32-unknown-unknown 2>&1`;

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

            const wasm = fs.readFileSync(wasmPath);
            const wasmSize = wasm.length;

            console.log(`[${new Date().toISOString()}] ✓ Compilation successful!`);
            console.log(`WASM size: ${wasmSize} bytes (${(wasmSize / 1024).toFixed(2)} KB)`);
            console.log(`Compilation time: ${compilationTime}ms`);

            // Send WASM binary
            res.setHeader("Content-Type", "application/wasm");
            res.setHeader("X-Compilation-Time", compilationTime.toString());
            res.setHeader("X-WASM-Size", wasmSize.toString());
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
    console.log("=".repeat(60));
    console.log("🚀 Casper Compilation Service");
    console.log("=".repeat(60));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ Compile endpoint: POST http://localhost:${PORT}/compile`);
    console.log(`✓ Started at: ${new Date().toISOString()}`);
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
