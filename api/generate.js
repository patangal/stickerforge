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

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    } catch (err) {
        return res.status(502).json({ error: 'Failed to reach Pollinations API. Please try again.' });
    }
}
