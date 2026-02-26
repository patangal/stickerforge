import sharp from 'sharp';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { prompt, width, height, model, seed, userKey } = req.query;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use user-provided key if available, otherwise fall back to server env key
    const apiKey = userKey || process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'No API key configured. Please add your key in Settings.' });
    }

    const params = new URLSearchParams({
        width: width || '512',
        height: height || '512',
        nologo: 'true',
        seed: seed || String(Math.floor(Math.random() * 999999)),
        model: model || 'flux',
        key: apiKey
    });

    const apiUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            return res.status(response.status).json({
                error: `Pollinations API error (${response.status}): ${errorText}`
            });
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // ── Background removal ──────────────────────────────────────────
        // Convert white / near-white pixels to transparent using sharp.
        // This keeps the serverless function lightweight (no ML model).
        try {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            const { width: w, height: h } = metadata;

            // Extract raw RGBA pixel data
            const raw = await image
                .ensureAlpha()          // guarantee 4 channels
                .raw()
                .toBuffer();

            // ── Flood-fill from edges ───────────────────────────────────
            // Only remove white pixels connected to the image border.
            // Interior white (eyes, highlights, teeth, etc.) is preserved.
            const THRESHOLD = 240;

            const isWhite = (idx) => {
                return raw[idx] >= THRESHOLD
                    && raw[idx + 1] >= THRESHOLD
                    && raw[idx + 2] >= THRESHOLD;
            };

            const pixelIndex = (x, y) => (y * w + x) * 4;

            // Track which pixels have been visited
            const visited = new Uint8Array(w * h);

            // BFS queue seeded with all border pixels that are white
            const queue = [];

            // Top & bottom rows
            for (let x = 0; x < w; x++) {
                if (isWhite(pixelIndex(x, 0))) { queue.push(x + 0 * w); visited[x + 0 * w] = 1; }
                if (isWhite(pixelIndex(x, h - 1))) { queue.push(x + (h - 1) * w); visited[x + (h - 1) * w] = 1; }
            }
            // Left & right columns
            for (let y = 0; y < h; y++) {
                if (isWhite(pixelIndex(0, y))) { queue.push(0 + y * w); visited[0 + y * w] = 1; }
                if (isWhite(pixelIndex(w - 1, y))) { queue.push((w - 1) + y * w); visited[(w - 1) + y * w] = 1; }
            }

            // BFS: spread inward through connected white pixels
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            let head = 0;
            while (head < queue.length) {
                const pos = queue[head++];
                const px = pos % w;
                const py = (pos - px) / w;

                // Make this pixel transparent
                raw[pos * 4 + 3] = 0;

                for (const [dx, dy] of dirs) {
                    const nx = px + dx;
                    const ny = py + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const npos = nx + ny * w;
                    if (visited[npos]) continue;
                    visited[npos] = 1;
                    if (isWhite(npos * 4)) {
                        queue.push(npos);
                    }
                }
            }

            const transparentPng = await sharp(raw, {
                raw: { width: w, height: h, channels: 4 }
            })
                .png()
                .toBuffer();

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(transparentPng);
        } catch (bgErr) {
            // If background removal fails for any reason, return the
            // original image so the app never breaks.
            console.warn('Background removal failed, returning original:', bgErr.message);
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(buffer);
        }
    } catch (err) {
        return res.status(502).json({ error: 'Failed to reach Pollinations API. Please try again.' });
    }
}
