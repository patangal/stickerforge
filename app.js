/* =========================================================
   StickerForge — Application Logic
   ========================================================= */

(function () {
    'use strict';

    // ---- Constants ----
    const API_ENDPOINT = '/api/generate';
    const STORAGE_KEY_GALLERY = 'stickerforge_gallery';
    const STORAGE_KEY_API_KEY = 'stickerforge_api_key';
    const STORAGE_KEY_MODEL = 'stickerforge_model';
    const MAX_GALLERY = 20;

    // Style presets — each modifies the user prompt for sticker generation
    const STYLE_PRESETS = {
        kawaii: {
            prefix: 'cute kawaii style sticker of',
            suffix: ', chibi, big eyes, pastel colors, die-cut sticker, white outline border, isolated on solid white background, high quality, digital illustration'
        },
        cartoon: {
            prefix: 'cartoon style sticker of',
            suffix: ', bold outlines, vibrant colors, die-cut sticker, white outline border, isolated on solid white background, high quality, digital illustration'
        },
        '3d': {
            prefix: '3D rendered sticker of',
            suffix: ', smooth shading, clay render, soft lighting, die-cut sticker, white outline border, isolated on solid white background, high quality render'
        },
        pixel: {
            prefix: 'pixel art style sticker of',
            suffix: ', retro pixel art, 16-bit style, crisp pixels, die-cut sticker, white outline border, isolated on solid white background'
        },
        minimalist: {
            prefix: 'minimalist flat design sticker of',
            suffix: ', simple shapes, clean lines, limited color palette, die-cut sticker, white outline border, isolated on solid white background, vector style'
        },
        watercolor: {
            prefix: 'watercolor art style sticker of',
            suffix: ', soft watercolor textures, artistic splashes, beautiful watercolor painting, die-cut sticker, white outline border, isolated on solid white background'
        },
        retro: {
            prefix: 'retro vintage style sticker of',
            suffix: ', 70s 80s aesthetic, retro colors, grainy texture, die-cut sticker, white outline border, isolated on solid white background'
        },
        emoji: {
            prefix: 'emoji style sticker of',
            suffix: ', round face expression, glossy style, Apple emoji inspired, die-cut sticker, white outline border, isolated on solid white background, digital art'
        }
    };

    // ---- DOM Elements ----
    const els = {
        // Settings
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        modalClose: document.getElementById('modal-close'),
        apiKeyInput: document.getElementById('api-key-input'),
        apiKeyToggle: document.getElementById('api-key-toggle'),
        modelSelect: document.getElementById('model-select'),
        saveSettings: document.getElementById('save-settings'),

        // Generator
        promptInput: document.getElementById('prompt-input'),
        charCount: document.getElementById('char-count'),
        styleGrid: document.getElementById('style-grid'),
        generateBtn: document.getElementById('generate-btn'),

        // Result states
        resultArea: document.getElementById('result-area'),
        emptyState: document.getElementById('empty-state'),
        loadingState: document.getElementById('loading-state'),
        stickerResult: document.getElementById('sticker-result'),
        errorState: document.getElementById('error-state'),
        stickerImage: document.getElementById('sticker-image'),
        errorText: document.getElementById('error-text'),

        // Actions
        downloadBtn: document.getElementById('download-btn'),
        regenerateBtn: document.getElementById('regenerate-btn'),
        retryBtn: document.getElementById('retry-btn'),

        // Gallery
        gallerySection: document.getElementById('gallery-section'),
        galleryGrid: document.getElementById('gallery-grid'),
        galleryEmpty: document.getElementById('gallery-empty'),
        clearGallery: document.getElementById('clear-gallery')
    };

    // ---- State ----
    let selectedStyle = 'kawaii';
    let currentBlobUrl = '';
    let isGenerating = false;

    // ---- Init ----
    function init() {
        loadSettings();
        loadGallery();
        setupEventListeners();
    }

    // ---- Settings ----
    function loadSettings() {
        const savedKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
        const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || 'flux';
        els.apiKeyInput.value = savedKey;
        els.modelSelect.value = savedModel;
    }

    function saveSettingsToStorage() {
        localStorage.setItem(STORAGE_KEY_API_KEY, els.apiKeyInput.value.trim());
        localStorage.setItem(STORAGE_KEY_MODEL, els.modelSelect.value);
    }

    function getUserKey() {
        return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    }

    function getModel() {
        return localStorage.getItem(STORAGE_KEY_MODEL) || 'flux';
    }

    // ---- Prompt Engineering ----
    function buildPrompt(userPrompt) {
        const preset = STYLE_PRESETS[selectedStyle];
        return `${preset.prefix} ${userPrompt.trim()}${preset.suffix}`;
    }

    // ---- API ----
    function buildApiUrl(prompt) {
        const params = new URLSearchParams({
            prompt: prompt,
            width: '512',
            height: '512',
            model: getModel(),
            seed: String(Math.floor(Math.random() * 999999))
        });

        // If user has their own key, send it so the serverless function uses it
        const userKey = getUserKey();
        if (userKey) {
            params.set('userKey', userKey);
        }

        return `${API_ENDPOINT}?${params.toString()}`;
    }

    async function generateSticker() {
        const userPrompt = els.promptInput.value.trim();
        if (!userPrompt) {
            els.promptInput.focus();
            shakeElement(els.promptInput);
            return;
        }

        if (isGenerating) return;
        isGenerating = true;

        showState('loading');
        els.generateBtn.classList.add('loading');

        const enhancedPrompt = buildPrompt(userPrompt);
        const apiUrl = buildApiUrl(enhancedPrompt);

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                let errorMsg = 'Failed to generate image. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // ignore parse error
                }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.startsWith('image/')) {
                throw new Error('Received invalid response from the server.');
            }

            const blob = await response.blob();

            // Revoke old blob URL
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }

            currentBlobUrl = URL.createObjectURL(blob);
            els.stickerImage.src = currentBlobUrl;
            showState('result');

            // Save to gallery using a re-fetchable URL
            addToGallery(apiUrl, userPrompt, selectedStyle);

        } catch (error) {
            els.errorText.textContent = error.message || 'Something went wrong. Please try again.';
            showState('error');
        } finally {
            isGenerating = false;
            els.generateBtn.classList.remove('loading');
        }
    }

    // ---- UI State Management ----
    function showState(state) {
        els.emptyState.classList.add('hidden');
        els.loadingState.classList.add('hidden');
        els.stickerResult.classList.add('hidden');
        els.errorState.classList.add('hidden');

        switch (state) {
            case 'empty':
                els.emptyState.classList.remove('hidden');
                break;
            case 'loading':
                els.loadingState.classList.remove('hidden');
                break;
            case 'result':
                els.stickerResult.classList.remove('hidden');
                break;
            case 'error':
                els.errorState.classList.remove('hidden');
                break;
        }
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { el.style.animation = ''; }, 400);
    }

    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
  `;
    document.head.appendChild(shakeStyle);

    // ---- Download ----
    function downloadSticker() {
        if (!currentBlobUrl) return;

        const a = document.createElement('a');
        a.href = currentBlobUrl;
        a.download = `stickerforge-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ---- Gallery ----
    function getGalleryItems() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_GALLERY)) || [];
        } catch {
            return [];
        }
    }

    function saveGalleryItems(items) {
        localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(items));
    }

    function addToGallery(apiUrl, prompt, style) {
        const items = getGalleryItems();
        items.unshift({
            url: apiUrl,
            prompt: prompt,
            style: style,
            timestamp: Date.now()
        });

        if (items.length > MAX_GALLERY) {
            items.length = MAX_GALLERY;
        }

        saveGalleryItems(items);
        renderGallery();
    }

    function renderGallery() {
        const items = getGalleryItems();
        els.galleryGrid.innerHTML = '';

        if (items.length === 0) {
            els.galleryEmpty.classList.remove('hidden');
            els.clearGallery.classList.add('hidden');
            return;
        }

        els.galleryEmpty.classList.add('hidden');
        els.clearGallery.classList.remove('hidden');

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.style.animationDelay = `${index * 0.05}s`;

            const safePrompt = item.prompt.replace(/"/g, '&quot;').replace(/</g, '&lt;');
            const safeUrl = item.url.replace(/"/g, '&quot;');

            div.innerHTML = `
        <img src="${safeUrl}" alt="${safePrompt}" loading="lazy" />
        <div class="gallery-item-overlay">
          <button class="gallery-download-btn" data-url="${safeUrl}" data-prompt="${safePrompt}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Save
          </button>
        </div>
      `;

            div.addEventListener('click', (e) => {
                if (e.target.closest('.gallery-download-btn')) return;
                // Re-fetch and display
                fetch(item.url)
                    .then(r => {
                        if (!r.ok) throw new Error('Failed');
                        return r.blob();
                    })
                    .then(blob => {
                        if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
                        currentBlobUrl = URL.createObjectURL(blob);
                        els.stickerImage.src = currentBlobUrl;
                        showState('result');
                        els.resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    })
                    .catch(() => {
                        // If re-fetch fails, just use the URL directly as image src
                        els.stickerImage.src = item.url;
                        showState('result');
                        els.resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
            });

            els.galleryGrid.appendChild(div);
        });

        els.galleryGrid.querySelectorAll('.gallery-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFromUrl(btn.dataset.url);
            });
        });
    }

    function downloadFromUrl(url) {
        fetch(url)
            .then(r => r.blob())
            .then(blob => {
                const objUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objUrl;
                a.download = `stickerforge-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objUrl);
            })
            .catch(() => {
                window.open(url, '_blank');
            });
    }

    function loadGallery() {
        renderGallery();
    }

    function clearGalleryItems() {
        if (confirm('Clear all saved stickers?')) {
            localStorage.removeItem(STORAGE_KEY_GALLERY);
            renderGallery();
        }
    }

    // ---- Event Listeners ----
    function setupEventListeners() {
        els.settingsBtn.addEventListener('click', () => {
            els.settingsModal.classList.add('active');
        });

        els.modalClose.addEventListener('click', closeModal);

        els.settingsModal.addEventListener('click', (e) => {
            if (e.target === els.settingsModal) closeModal();
        });

        els.saveSettings.addEventListener('click', () => {
            saveSettingsToStorage();
            closeModal();
        });

        els.apiKeyToggle.addEventListener('click', () => {
            const isPassword = els.apiKeyInput.type === 'password';
            els.apiKeyInput.type = isPassword ? 'text' : 'password';
        });

        els.promptInput.addEventListener('input', () => {
            els.charCount.textContent = `${els.promptInput.value.length}/500`;
        });

        els.styleGrid.addEventListener('click', (e) => {
            const chip = e.target.closest('.style-chip');
            if (!chip) return;
            els.styleGrid.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedStyle = chip.dataset.style;
        });

        els.generateBtn.addEventListener('click', generateSticker);

        els.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateSticker();
            }
        });

        els.downloadBtn.addEventListener('click', downloadSticker);
        els.regenerateBtn.addEventListener('click', generateSticker);
        els.retryBtn.addEventListener('click', generateSticker);
        els.clearGallery.addEventListener('click', clearGalleryItems);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && els.settingsModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function closeModal() {
        els.settingsModal.classList.remove('active');
    }

    // ---- Start ----
    init();

})();
