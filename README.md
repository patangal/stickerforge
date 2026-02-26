# ✦ StickerForge

> **AI-powered sticker generator for Telegram & WhatsApp.**  
> Create custom transparent stickers by describing what you want, pick a style, and download — instantly.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/patangal/stickerforge)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **8 Style Presets** | Kawaii, Cartoon, 3D Render, Pixel Art, Minimalist, Watercolor, Retro, Emoji |
| ⚡ **Instant Generation** | Describe anything and get a 512×512 sticker in seconds |
| 🪟 **Transparent Background** | Auto-removes white backgrounds — downloads as clean RGBA PNG |
| 📥 **One-Click Download** | Save as transparent PNG, ready for Telegram/WhatsApp |
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

> [!IMPORTANT]
> After pushing code changes, **redeploy on Vercel** to install the `sharp` dependency for transparent backgrounds.

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
                              │                           │
                              ▼                           ▼
                        ┌─────────────┐          ┌──────────────┐
                        │ sharp: auto │          │   Opaque     │
                        │ white→trans  │          │   Image      │
                        └─────────────┘          └──────────────┘
                              │                           │
                              ▼                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   LocalStorage  │     │ Transparent PNG│     │ User Download   │
│   Gallery (20)  │     │ (RGBA 512×512)   │     │ (Telegram/WhatsApp│
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **AI Provider** | [Pollinations.ai](https://pollinations.ai) — Free AI Image Generation |
| **Image Processing** | [sharp](https://sharp.pixelplumbing.com) — Fast native background removal |
| **Models** | Flux Schnell (default), Z-Image Turbo, GPT Image |
| **Storage** | LocalStorage (client-side gallery) |
| **Fonts** | Inter, Outfit (Google Fonts) |

## 🪟 Transparent Backgrounds

StickerForge automatically removes white backgrounds so your stickers are ready to use immediately.

**How it works:**
1. Pollinations generates the image with a white background
2. Serverless function uses `sharp` to detect near-white pixels (R,G,B ≥ 240)
3. Converts those pixels to transparent alpha channel
4. Returns a clean RGBA PNG — no manual editing needed

**Graceful fallback:** If processing fails, the original image is returned so generation never breaks.

**UI cues:**
- Checkerboard pattern behind sticker preview (like Photoshop)
- "Generating & removing background…" loading text
- "Download Transparent PNG" button

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

## 🤖 AI Models

| Model | Best For | Speed | Quality |
|-------|----------|-------|---------|
| **Flux Schnell** | General use, reliable results | ⚡ Fast | ⭐⭐⭐ Good |
| **Z-Image Turbo** | Stickers specifically — better edge detail | ⚡ Fast | ⭐⭐⭐⭐ Better |
| **GPT Image** | Maximum quality when speed doesn't matter | 🐢 Slower | ⭐⭐⭐⭐⭐ Best |

> Legacy `turbo` (SDXL) users are automatically migrated to `flux` via app.js validation.

## 📂 Project Structure

```
stickerforge/
├── index.html          # Main UI — Hero, generator, gallery
├── index.css           # Complete design system — dark theme, glassmorphism
├── app.js              # Application logic — generation, gallery, settings
├── package.json        # Dependencies (sharp) + dev server scripts
├── vercel.json         # Vercel config — SPA routing, caching, headers
├── api/
│   └── generate.js     # Serverless function — AI proxy + sharp processing
└── LICENSE.txt         # MIT License
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POLLINATIONS_API_KEY` | No | Server-side API key for Pollinations. If not set, users must provide their own in Settings. |

### User Settings

Users can configure in-app:

- **API Key** — Optional personal key (stored in LocalStorage)
- **AI Model** — Flux Schnell (default), Z-Image Turbo, or GPT Image

## 🔌 API Endpoint

### `GET /api/generate`

Proxies image generation requests to Pollinations.ai with automatic background removal.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | The image prompt (pre-enhanced by style preset) |
| `width` | number | No | Image width (default: 512) |
| `height` | number | No | Image height (default: 512) |
| `model` | string | No | AI model: `flux`, `zimage`, `gptimage` (default: flux) |
| `seed` | number | No | Random seed for reproducibility |
| `userKey` | string | No | User's personal API key (optional) |

**Response:** Transparent PNG image (Content-Type: image/png)

## 🛡️ Security

- **CORS enabled** — API endpoint allows cross-origin requests
- **No server-side storage** — Images flow directly from Pollinations through sharp to user
- **API key proxying** — Keys are passed through but never logged
- **Security headers** — X-Content-Type-Options, X-Frame-Options
- **Input validation** — Prompt length limited to 500 characters

## 📝 License

MIT © [Patangal Basak](https://github.com/patangal)

## 🙏 Acknowledgments

- [Pollinations.ai](https://pollinations.ai) — Free AI image generation API
- [sharp](https://sharp.pixelplumbing.com) — High-performance Node.js image processing
- [Vercel](https://vercel.com) — Serverless hosting
- [Inter & Outfit](https://fonts.google.com) — Beautiful typefaces

---

**Made with ✦ by Patangal**
