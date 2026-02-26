# ✦ StickerForge

> **AI-powered sticker generator for Telegram & WhatsApp.**  
> Create custom stickers by describing what you want, pick a style, and download — instantly.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/patangal/stickerforge)

![StickerForge Preview](https://gen.pollinations.ai/image/StickerForge%20app%20screenshot%20mockup%20showing%20sticker%20generation%20interface%20with%20colorful%20stickers%20on%20dark%20background%20UI%20design?width=1200&height=600&nologo=true)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **8 Style Presets** | Kawaii, Cartoon, 3D Render, Pixel Art, Minimalist, Watercolor, Retro, Emoji |
| ⚡ **Instant Generation** | Describe anything and get a 512×512 sticker in seconds |
| 📥 **One-Click Download** | Save as PNG, ready for Telegram/WhatsApp |
| 🔑 **Optional API Key** | Use free tier or bring your own Pollinations API key |
| 🖼️ **Local Gallery** | Your last 20 stickers saved locally in browser |
| 📱 **Fully Responsive** | Works beautifully on desktop, tablet, and mobile |
| 🌙 **Dark Mode UI** | Sleek, modern interface with animated gradient background |
| 🔄 **Regenerate & Retry** | Not perfect? Try again with one click |

## 🚀 Quick Start

### Deploy to Vercel (Recommended)

1. **Click the button above** → Deploy to Vercel
2. **Add your Pollinations API key** in Vercel environment variables (optional but recommended)
   - Name: `POLLINATIONS_API_KEY`
   - Value: Your key from [enter.pollinations.ai](https://enter.pollinations.ai)
3. **Done!** Your sticker generator is live 🎉

### Run Locally

```bash
# Clone the repo
git clone https://github.com/patangal/stickerforge.git
cd stickerforge

# Start local server
npm run dev
# or
npx serve .

# Open http://localhost:3000
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Input    │────▶│  /api/generate   │────▶│  Pollinations   │
│  (HTML/CSS/JS)  │     │ (Serverless Fn)  │     │  AI Generation  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                               │
         │                                               ▼
         │                                      ┌─────────────────┐
         │                                      │   Generated     │
         │                                      │   Sticker PNG   │
         │                                      └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌──────────────────┐
│   LocalStorage  │                            │  User Download   │
│   Gallery (20)  │                            │  (PNG 512×512)   │
└─────────────────┘                            └──────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **AI Provider** | [Pollinations.ai](https://pollinations.ai) — Free AI Image Generation |
| **Models** | Flux (default), Turbo, GPT Image |
| **Storage** | LocalStorage (client-side gallery) |
| **Fonts** | Inter, Outfit (Google Fonts) |

## 📂 Project Structure

```
stickerforge/
├── index.html          # Main UI — Hero, generator, gallery
├── index.css           # Complete design system — dark theme, glassmorphism
├── app.js              # Application logic — generation, gallery, settings
├── package.json        # Dev server scripts
├── vercel.json         # Vercel config — SPA routing, caching, headers
├── api/
│   └── generate.js     # Serverless function — proxies to Pollinations API
└── LICENSE.txt         # MIT License
```

## 🎨 Style Presets

Each style automatically wraps your prompt with optimized keywords for sticker generation:

| Style | What It Adds |
|-------|--------------|
| **Kawaii** | `cute kawaii style, chibi, big eyes, pastel colors` |
| **Cartoon** | `cartoon style, bold outlines, vibrant colors` |
| **3D Render** | `3D rendered, smooth shading, clay render, soft lighting` |
| **Pixel Art** | `pixel art style, retro pixel art, 16-bit style, crisp pixels` |
| **Minimalist** | `minimalist flat design, simple shapes, clean lines, vector style` |
| **Watercolor** | `watercolor art style, soft textures, artistic splashes` |
| **Retro** | `retro vintage style, 70s 80s aesthetic, grainy texture` |
| **Emoji** | `emoji style, round face expression, glossy, Apple emoji inspired` |

**All styles include:** `die-cut sticker, white outline border, isolated on solid white background`

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POLLINATIONS_API_KEY` | No | Server-side API key for Pollinations. If not set, users must provide their own in Settings. |

### User Settings

Users can configure in-app:

- **API Key** — Optional personal key (stored in LocalStorage)
- **AI Model** — Flux (default), Turbo, or GPT Image

## 🔌 API Endpoint

### `GET /api/generate`

Proxies image generation requests to Pollinations.ai with proper CORS and caching.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | The image prompt (pre-enhanced by style preset) |
| `width` | number | No | Image width (default: 512) |
| `height` | number | No | Image height (default: 512) |
| `model` | string | No | AI model: `flux`, `turbo`, `gptimage` (default: flux) |
| `seed` | number | No | Random seed for reproducibility |
| `userKey` | string | No | User's personal API key (optional) |

**Response:** PNG image (Content-Type: image/png)

## 🛡️ Security

- **CORS enabled** — API endpoint allows cross-origin requests
- **No server-side storage** — Images flow directly from Pollinations to user
- **API key proxying** — Keys are passed through but never logged
- **Security headers** — X-Content-Type-Options, X-Frame-Options
- **Input validation** — Prompt length limited to 500 characters

## 📝 License

MIT © [Patangal Basak](https://github.com/patangal)

## 🙏 Acknowledgments

- [Pollinations.ai](https://pollinations.ai) — Free AI image generation API
- [Vercel](https://vercel.com) — Serverless hosting
- [Inter & Outfit](https://fonts.google.com) — Beautiful typefaces

---

**Made with ✦ by Patangal**
