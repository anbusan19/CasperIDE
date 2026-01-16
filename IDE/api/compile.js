// Vercel Serverless Function - Compilation Proxy
// Proxies compilation requests to GCP server to avoid mixed content errors

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
    maxDuration: 300, // 5 minutes for compilation
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Get GCP compiler URL from environment variable
        const compilerUrl = process.env.VITE_COMPILER_SERVICE_URL || 'http://20.193.142.1:8080';

        console.log('[Compile Proxy] Forwarding to GCP:', compilerUrl);

        // Forward the request to GCP compiler
        const formData = new FormData();

        // Get the source code from request body
        const { source } = req.body;
        if (!source) {
            return res.status(400).json({ error: 'No source code provided' });
        }

        // Create a blob for the source file
        const blob = new Blob([source], { type: 'text/plain' });
        formData.append('source', blob, 'lib.rs');

        const response = await fetch(`${compilerUrl}/compile`, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type - let fetch set it with boundary
            },
            signal: AbortSignal.timeout(300000), // 5 min timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Compile Proxy] GCP Error:', errorText);
            return res.status(response.status).json({
                error: 'Compilation failed',
                details: errorText,
            });
        }

        // Get the compiled WASM binary
        const wasmBuffer = await response.arrayBuffer();
        const compilationTime = response.headers.get('X-Compilation-Time');
        const wasmSize = response.headers.get('X-WASM-Size');

        console.log('[Compile Proxy] Success! WASM size:', wasmSize, 'bytes');

        // Return the WASM binary
        res.setHeader('Content-Type', 'application/wasm');
        if (compilationTime) res.setHeader('X-Compilation-Time', compilationTime);
        if (wasmSize) res.setHeader('X-WASM-Size', wasmSize);

        return res.send(Buffer.from(wasmBuffer));
    } catch (error) {
        console.error('[Compile Proxy] Error:', error);
        return res.status(500).json({
            error: 'Proxy error',
            details: error.message,
        });
    }
}
