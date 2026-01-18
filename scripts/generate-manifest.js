/**
 * PWA Manifest Generator
 *
 * Generates manifest.json for the PWA with environment-aware paths.
 * When GITHUB_PAGES=true, uses /tictacdoh/ base path.
 * Otherwise, uses / root path.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'manifest.json');

// Determine base path from environment
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const BASE_PATH = isGitHubPages ? '/tictacdoh/' : '/';

// Icon sizes matching generate-icons.js
const STANDARD_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

function buildIconPath(filename) {
  return `${BASE_PATH}icons/${filename}`;
}

function generateManifest() {
  const manifest = {
    name: 'Tic-Tac-Doh - A Doughy Tic-Tac-Toe Game',
    short_name: 'Tic-Tac-Doh',
    description:
      'A fun tic-tac-toe game with human vs human, human vs CPU, and CPU vs CPU modes',
    start_url: BASE_PATH,
    scope: BASE_PATH,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#fdde97',
    background_color: '#fdde97',
    icons: [
      // Standard icons
      ...STANDARD_SIZES.map((size) => ({
        src: buildIconPath(`icon-${size}.png`),
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any',
      })),
      // Maskable icon
      {
        src: buildIconPath('icon-512-maskable.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return manifest;
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

function main() {
  console.log('PWA Manifest Generator');
  console.log('======================');
  console.log(`GITHUB_PAGES: ${isGitHubPages}`);
  console.log(`Base path: ${BASE_PATH}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');

  ensureOutputDir();

  const manifest = generateManifest();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  console.log('Generated manifest.json with:');
  console.log(`  - name: ${manifest.name}`);
  console.log(`  - short_name: ${manifest.short_name}`);
  console.log(`  - start_url: ${manifest.start_url}`);
  console.log(`  - scope: ${manifest.scope}`);
  console.log(`  - display: ${manifest.display}`);
  console.log(`  - theme_color: ${manifest.theme_color}`);
  console.log(`  - icons: ${manifest.icons.length} icons`);
  console.log('');
  console.log('Done!');
}

main();
