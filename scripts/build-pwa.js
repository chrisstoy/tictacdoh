/**
 * PWA Build Pipeline
 *
 * Executes all build steps in the correct order:
 * 1. Generate PWA icons from source asset
 * 2. Run expo export for web platform
 * 3. Copy icons from public/icons to dist/icons
 * 4. Generate web app manifest
 * 5. Generate service worker with Workbox
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_ICONS_DIR = path.join(ROOT_DIR, 'public', 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_ICONS_DIR = path.join(DIST_DIR, 'icons');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

// Determine base path from environment
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const BASE_PATH = isGitHubPages ? '/tictacdoh/' : '/';

function runCommand(command, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step: ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(command, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log(`\n✓ ${description} completed successfully`);
  } catch (error) {
    console.error(`\n✗ ${description} failed`);
    process.exit(1);
  }
}

function injectManifestLink() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Step: Inject manifest link into index.html');
  console.log(`${'='.repeat(60)}\n`);

  if (!fs.existsSync(INDEX_HTML)) {
    console.error('Error: index.html not found in dist/');
    process.exit(1);
  }

  let html = fs.readFileSync(INDEX_HTML, 'utf-8');

  // Check if manifest link already exists
  if (html.includes('rel="manifest"') || html.includes("rel='manifest'")) {
    console.log('Manifest link already exists in index.html');
    return;
  }

  // Inject manifest link before </head>
  const manifestLink = `<link rel="manifest" href="${BASE_PATH}manifest.json"/>`;
  html = html.replace('</head>', `${manifestLink}</head>`);

  fs.writeFileSync(INDEX_HTML, html, 'utf-8');

  console.log(`Injected: ${manifestLink}`);
  console.log('\n✓ Manifest link injected into index.html');
}

function copyIcons() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Step: Copy icons to dist/icons');
  console.log(`${'='.repeat(60)}\n`);

  // Ensure dist/icons directory exists
  if (!fs.existsSync(DIST_ICONS_DIR)) {
    fs.mkdirSync(DIST_ICONS_DIR, { recursive: true });
    console.log(`Created: ${DIST_ICONS_DIR}`);
  }

  // Copy each icon file
  const iconFiles = fs.readdirSync(PUBLIC_ICONS_DIR);
  let copiedCount = 0;

  for (const file of iconFiles) {
    if (file.endsWith('.png')) {
      const srcPath = path.join(PUBLIC_ICONS_DIR, file);
      const destPath = path.join(DIST_ICONS_DIR, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${file}`);
      copiedCount++;
    }
  }

  console.log(`\n✓ Copied ${copiedCount} icon files to dist/icons`);
}

function main() {
  console.log('PWA Build Pipeline');
  console.log('==================');
  console.log(`GITHUB_PAGES: ${process.env.GITHUB_PAGES || 'not set'}`);
  console.log('');

  // Step 1: Generate icons
  runCommand('npm run generate:icons', 'Generate PWA icons');

  // Step 2: Expo export
  runCommand('npx expo export --platform web', 'Expo export for web');

  // Step 3: Copy icons to dist
  copyIcons();

  // Step 4: Inject manifest link into HTML
  injectManifestLink();

  // Step 5: Generate manifest
  runCommand('npm run generate:manifest', 'Generate web app manifest');

  // Step 6: Generate service worker
  runCommand('npm run generate:sw', 'Generate service worker');

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Build Complete!');
  console.log(`${'='.repeat(60)}\n`);

  // Verify output
  const requiredFiles = ['index.html', 'manifest.json', 'sw.js'];
  const requiredDirs = ['icons'];

  console.log('Verifying dist/ contents:');

  for (const file of requiredFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ✗ ${file} (missing!)`);
    }
  }

  for (const dir of requiredDirs) {
    const dirPath = path.join(DIST_DIR, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      const files = fs.readdirSync(dirPath);
      console.log(`  ✓ ${dir}/ (${files.length} files)`);
    } else {
      console.log(`  ✗ ${dir}/ (missing!)`);
    }
  }

  console.log('\nPWA build pipeline completed successfully!');
}

main();
