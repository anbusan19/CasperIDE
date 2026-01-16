// Vercel Serverless Function - Compilation Proxy
// Proxies compilation requests to GCP server to avoid mixed content errors

export const config = {
    api: {
        bodyParser: false, // Disable body parser to handle multipart form data
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

        // Import fetch (Node 18+ has it built-in, but explicitly use it)
        const fetch = globalThis.fetch || (await import('node-fetch')).default;

        // Forward the entire request body to GCP
        const response = await fetch(`${compilerUrl}/compile`, {
            method: 'POST',
            body: req, // Forward the raw request stream
            headers: {
                ...req.headers,
                'host': new URL(compilerUrl).host, // Update host header
            },
            signal: AbortSignal.timeout(300000), // 5 min timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Compile Proxy] GCP Error:', errorText);
            return res.status(response.status).send(errorText);
        }

        // Get the compiled WASM binary
        const wasmBuffer = await response.arrayBuffer();
        const compilationTime = response.headers.get('X-Compilation-Time');
        const wasmSize = response.headers.get('X-WASM-Size');

        console.log('[Compile Proxy] Success! WASM size:', wasmSize, 'bytes');

        // Return the WASM binary with headers
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
