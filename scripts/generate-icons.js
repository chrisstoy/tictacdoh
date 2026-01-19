/**
 * PWA Icon Generator
 *
 * Generates PWA icons from the source icon.png asset.
 * Creates 9 PNG files in public/icons/ directory:
 * - Standard icons: 72, 96, 128, 144, 152, 192, 384, 512 pixels
 * - Maskable icon: 512 pixels with 40% safe zone padding
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '..', 'assets', 'icon.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const BACKGROUND_COLOR = '#fdde97';

// Standard PWA icon sizes
const STANDARD_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

async function generateStandardIcon(size) {
  const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);

  await sharp(SOURCE_ICON)
    .resize(size, size, {
      fit: 'contain',
      background: BACKGROUND_COLOR,
    })
    .flatten({ background: BACKGROUND_COLOR })
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}.png`);
}

async function generateMaskableIcon() {
  const size = 512;
  const outputPath = path.join(OUTPUT_DIR, 'icon-512-maskable.png');

  // Maskable icons need 40% safe zone (padding on each side = 20% of total)
  // The safe zone is 80% of the icon, so we scale the content to 60% to ensure
  // it stays within the safe zone (leaving 20% padding on each side)
  const safeZoneRatio = 0.6; // Content should be 60% of the icon
  const contentSize = Math.floor(size * safeZoneRatio);
  const padding = Math.floor((size - contentSize) / 2);

  // Create a background with the theme color
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .png()
    .toBuffer();

  // Resize the source icon to fit within safe zone
  const resizedIcon = await sharp(SOURCE_ICON)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Composite the resized icon onto the background
  await sharp(background)
    .composite([
      {
        input: resizedIcon,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log('Generated: icon-512-maskable.png (with 40% safe zone)');
}

async function main() {
  console.log('PWA Icon Generator');
  console.log('==================');
  console.log(`Source: ${SOURCE_ICON}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Background: ${BACKGROUND_COLOR}`);
  console.log('');

  // Check source exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }

  await ensureOutputDir();

  // Generate standard icons
  console.log('Generating standard icons...');
  for (const size of STANDARD_SIZES) {
    await generateStandardIcon(size);
  }

  // Generate maskable icon
  console.log('\nGenerating maskable icon...');
  await generateMaskableIcon();

  console.log('\nDone! Generated 9 PWA icons.');
}

main().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
