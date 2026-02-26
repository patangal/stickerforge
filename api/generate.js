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

            // Threshold: any pixel whose R, G, B are all >= this value
            // is considered "white background" and made transparent.
            const THRESHOLD = 240;

            for (let i = 0; i < raw.length; i += 4) {
                const r = raw[i];
                const g = raw[i + 1];
                const b = raw[i + 2];
                if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
                    raw[i + 3] = 0; // set alpha to 0 (transparent)
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
