# PWA Implementation Plan for Tic-Tac-Doh

## Overview
Transform the web build into an installable Progressive Web App with offline support and custom install prompts.

**User Preferences**: Workbox for service worker + custom install prompt UI

## Implementation Strategy

**Key Decision**: Use Workbox CLI (not webpack plugin) since Expo SDK 54 uses Metro bundler.

**Build Pipeline** (4 steps):
1. Generate icons from `assets/icon.png` → 9 PWA icon sizes
2. Run `expo export --platform web` → Bundle to `dist/`
3. Generate `manifest.json` with environment-aware paths
4. Run Workbox CLI → Generate `sw.js` service worker

## Critical Files

### New Files to Create

1. **`public/manifest.template.json`** - Web app manifest with `{{BASE_PATH}}` placeholders
   - Icons: 72, 96, 128, 144, 152, 192, 384, 512px + 512px maskable
   - `start_url` and `scope`: Dynamic based on GITHUB_PAGES env var
   - Theme: `#fdde97` (background), `#632f16` (border)
   - Display: `standalone`, Orientation: `portrait`

2. **`workbox-config.js`** - Workbox CLI configuration
   - Precache: HTML, CSS, JS, small assets
   - Runtime cache strategies:
     - Large audio files (setup-music, game-setup-music): Cache-first
     - Images: Cache-first, 60 entries max, 30 days
     - Fonts: Cache-first, 10 entries max, 365 days
   - Output: `dist/sw.js`

3. **`scripts/generate-icons.js`** - Icon generation using Sharp
   - Read `assets/icon.png` (1024x1024 source)
   - Generate 8 standard sizes: 72, 96, 128, 144, 152, 192, 384, 512px
   - Generate 1 maskable icon: 512px with 40% padding (safe zone)
   - Output: `public/icons/*.png`
   - Background color: `#fdde97` for padding

4. **`scripts/generate-manifest.js`** - Manifest generation with env vars
   - Read `public/manifest.template.json`
   - Replace `{{BASE_PATH}}` with `/tictacdoh/` (GitHub Pages) or `/` (local)
   - Output: `dist/manifest.json`

5. **`src/app/+html.tsx`** - Expo Router HTML customization
   - Add PWA meta tags: `theme-color`, `apple-mobile-web-app-*`, etc.
   - Add manifest link: `<link rel="manifest" href="${baseUrl}manifest.json">`
   - Add Apple touch icons: 152px and 192px sizes
   - Base URL from `process.env.GITHUB_PAGES`

6. **`src/utils/registerServiceWorker.ts`** - SW registration utility
   - SSR safety check: `typeof window !== 'undefined'`
   - Browser support check: `'serviceWorker' in navigator`
   - Register `${basePath}sw.js` on window load
   - Log registration success/failure
   - Optional: Listen for update events

7. **`src/components/PWAInstallPrompt.tsx`** - Custom install prompt
   - Listen for `beforeinstallprompt` event
   - Show after 30 seconds engagement delay
   - Store dismissal in AsyncStorage (`@tic-tac-doh/install-prompt-dismissed`)
   - UI: Banner at bottom with "Install" and "Not Now" buttons
   - Styling: Match game theme (dough background, outline border)
   - Platform check: Only show on web

### Files to Modify

8. **`package.json`**
   - Add devDependencies: `sharp@^0.33.2`, `workbox-cli@^7.0.0`
   - Update build script:
     ```json
     "build": "npm run generate:icons && expo export --platform web && npm run generate:manifest && npm run generate:sw"
     ```
   - Add helper scripts:
     ```json
     "generate:icons": "node scripts/generate-icons.js",
     "generate:manifest": "node scripts/generate-manifest.js",
     "generate:sw": "workbox generateSW workbox-config.js"
     ```

9. **`src/app/_layout.tsx`**
   - Import: `import { registerServiceWorker } from '@/utils/registerServiceWorker';`
   - Add useEffect after font loading:
     ```typescript
     useEffect(() => {
       registerServiceWorker();
     }, []);
     ```

10. **`src/app/index.tsx`**
    - Import: `import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';`
    - Add component at end of main View (after all mode screens):
      ```tsx
      <PWAInstallPrompt />
      ```

11. **`.gitignore`**
    - Add:
      ```
      # PWA generated files
      /public/icons/*.png
      /dist/manifest.json
      /dist/sw.js
      ```

## Implementation Sequence

### Phase 1: Dependencies & Icons
1. Add `sharp` and `workbox-cli` to devDependencies
2. Create `scripts/generate-icons.js`
3. Run icon generation script
4. Verify 9 icons created in `public/icons/`

### Phase 2: Core PWA Files
5. Create `public/manifest.template.json`
6. Create `scripts/generate-manifest.js`
7. Create `workbox-config.js`
8. Create `src/utils/registerServiceWorker.ts`
9. Create `src/app/+html.tsx`

### Phase 3: Install Prompt
10. Create `src/components/PWAInstallPrompt.tsx`

### Phase 4: Integration
11. Modify `src/app/_layout.tsx` (add SW registration)
12. Modify `src/app/index.tsx` (add install prompt)
13. Update `package.json` build scripts
14. Update `.gitignore`

### Phase 5: Testing
15. Run `npm run build` locally
16. Serve with `npx http-server dist -p 8080`
17. Test in Chrome DevTools:
    - Application → Manifest (verify loads)
    - Application → Service Workers (verify registered)
    - Network → Offline (test offline functionality)
18. Run Lighthouse PWA audit (target: ≥90 score)
19. Test install prompt after 30 seconds
20. Deploy to GitHub Pages and verify with `/tictacdoh/` path

## Caching Strategy Details

**Precached** (loaded during SW installation):
- HTML: `index.html`, `+not-found.html`
- CSS: `/_expo/static/css/*.css` (~10KB)
- JS: `/_expo/static/js/*.js` (~1.8MB)
- Small images: All PNGs except large audio files
- Fonts: `.ttf` files

**Runtime Cache-First** (loaded on demand, cached for reuse):
- Large audio: `setup-music.mp3` (190KB), `game-setup-music.mp3` (2.5MB)
- All other audio: 9 sound effects (~340KB total)
- Images: All game assets and icons
- Fonts: Komigo custom font

**Total precache size**: ~2.3MB
**Total runtime cache**: ~3MB (audio) + assets as used

## Testing Checklist

### Local Testing
- [ ] Build completes without errors
- [ ] `dist/manifest.json` exists with `start_url: "/"`
- [ ] `dist/icons/` contains 9 PNG files
- [ ] `dist/sw.js` exists
- [ ] Service worker registers in DevTools
- [ ] Manifest loads correctly in Application tab
- [ ] Install prompt appears after 30 seconds
- [ ] App works offline after first load
- [ ] Audio plays from cache offline

### Lighthouse PWA Audit
- [ ] Installable: YES
- [ ] Fast and reliable: YES
- [ ] PWA optimized: YES
- [ ] Score ≥ 90

### GitHub Pages Testing
- [ ] Manifest URL: `https://chrisstoy.github.io/tictacdoh/manifest.json`
- [ ] Manifest `start_url`: `/tictacdoh/`
- [ ] Service worker registers with correct scope
- [ ] All icon URLs resolve (no 404s)
- [ ] Can install on Chrome Desktop
- [ ] Can install on Android Chrome
- [ ] Can add to iOS Home Screen
- [ ] Lighthouse audit passes on deployed site

## Success Criteria

✅ App installable on Chrome Desktop and Android
✅ App can be added to iOS Home Screen
✅ Custom install prompt appears after 30s engagement
✅ Game fully playable offline (including audio)
✅ Lighthouse PWA score ≥90
✅ Works on both local (`/`) and GitHub Pages (`/tictacdoh/`) paths
✅ No console errors related to PWA functionality

## Potential Issues & Solutions

**Issue 1**: Metro doesn't copy `public/` to `dist/`
**Solution**: Add post-export copy script if needed:
```javascript
// scripts/copy-public.js
const fs = require('fs-extra');
fs.copySync('public', 'dist', { overwrite: true });
```

**Issue 2**: AsyncStorage fails in some browsers
**Solution**: Fallback to localStorage in PWAInstallPrompt component

**Issue 3**: iOS Safari doesn't support `beforeinstallprompt`
**Solution**: Detect iOS and show "Add to Home Screen" instructions instead

**Issue 4**: Service worker scope mismatch on GitHub Pages
**Solution**: Ensure SW registration uses correct base path from env var
