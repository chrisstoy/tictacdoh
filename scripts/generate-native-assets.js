/**
 * Stage the existing Expo artwork under the filenames @capacitor/assets reads,
 * then generate iOS and Android icons and splashes. Does not redraw art and
 * does not touch the PWA icon pipeline.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const APP_BACKGROUND = '#fdde97';
const SPLASH_CANVAS_SIZE = 2732;
const LAUNCH_IMAGE_CONTENT_MODE = 'scaleAspectFit';

/** Square that fits inside a circular launcher mask. */
function circleSafeScale() {
  return 1 / Math.sqrt(2);
}

/**
 * Android 12 splash icons are masked to the inner two-thirds of the bitmap.
 * The artwork has to sit inside that smaller circle, not the bitmap's own circle.
 */
function android12SplashScale() {
  return (2 / 3) * circleSafeScale();
}

/** Yellow should fill the mask. A non-zero background inset leaves black corners. */
function adaptiveBackgroundInset() {
  return '0%';
}

const nativeAssetSources = {
  'icon-only.png': 'assets/icon.png',
  'icon-foreground.png': 'assets/adaptive-icon.png',
  'splash.png': 'assets/splash-screen.png',
  splashIcon: 'assets/splash-icon.png',
};

const androidSplashIconRelativePath = 'android/app/src/main/res/drawable-nodpi/splash_icon.png';

function launchStoryboardXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="17132" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="17105"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="root-view">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView userInteractionEnabled="NO" contentMode="${LAUNCH_IMAGE_CONTENT_MODE}" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="Splash" translatesAutoresizingMaskIntoConstraints="NO" id="splash-image">
                                <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                            </imageView>
                        </subviews>
                        <color key="backgroundColor" red="0.992156862745098" green="0.8705882352941177" blue="0.592156862745098" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="splash-image" firstAttribute="top" secondItem="root-view" secondAttribute="top" id="splash-top"/>
                            <constraint firstItem="splash-image" firstAttribute="leading" secondItem="root-view" secondAttribute="leading" id="splash-leading"/>
                            <constraint firstAttribute="trailing" secondItem="splash-image" secondAttribute="trailing" id="splash-trailing"/>
                            <constraint firstAttribute="bottom" secondItem="splash-image" secondAttribute="bottom" id="splash-bottom"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
    <resources>
        <image name="Splash" width="1366" height="1366"/>
    </resources>
</document>
`;
}

function splashNeedsDocumentedSquare(width, height) {
  return width < SPLASH_CANVAS_SIZE || height < SPLASH_CANVAS_SIZE;
}

async function containArtwork(source, dest, canvas, scale) {
  const inner = Math.max(1, Math.round(canvas * scale));
  const artwork = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: APP_BACKGROUND })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: APP_BACKGROUND,
    },
  })
    .composite([{ input: artwork, gravity: 'centre' }])
    .png()
    .toFile(dest);
}

async function stageSources(root, stagingDir) {
  await fs.promises.mkdir(stagingDir, { recursive: true });

  await fs.promises.copyFile(
    path.join(root, nativeAssetSources['icon-only.png']),
    path.join(stagingDir, 'icon-only.png')
  );
  // @capacitor/assets then insets the foreground another 16.7%. Pre-fitting
  // the art to the inscribed square keeps a circular mask from clipping it.
  await containArtwork(
    path.join(root, nativeAssetSources['icon-foreground.png']),
    path.join(stagingDir, 'icon-foreground.png'),
    1024,
    circleSafeScale()
  );

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: APP_BACKGROUND,
    },
  })
    .png()
    .toFile(path.join(stagingDir, 'icon-background.png'));

  const splashSource = path.join(root, nativeAssetSources['splash.png']);
  const splashMeta = await sharp(splashSource).metadata();
  const sourceWidth = splashMeta.width ?? 0;
  const sourceHeight = splashMeta.height ?? 0;

  // The generator cover-resizes onto square iOS splashes. Containing the
  // portrait source on the documented square keeps the title and character.
  await sharp(splashSource)
    .resize(SPLASH_CANVAS_SIZE, SPLASH_CANVAS_SIZE, {
      fit: 'contain',
      background: APP_BACKGROUND,
    })
    .png()
    .toFile(path.join(stagingDir, 'splash.png'));

  const splashIconDest = path.join(root, androidSplashIconRelativePath);
  await fs.promises.mkdir(path.dirname(splashIconDest), { recursive: true });
  await fs.promises.copyFile(path.join(root, nativeAssetSources.splashIcon), splashIconDest);

  return { sourceWidth, sourceHeight };
}

async function generateNativeAssets() {
  const root = path.join(__dirname, '..');
  // @capacitor/assets joins this path onto the project root, so it must be relative.
  const stagingRelative = path.join('.agents', '.dark-factory', 'native-assets');
  const stagingDir = path.join(root, stagingRelative);

  try {
    const { sourceWidth, sourceHeight } = await stageSources(root, stagingDir);

    if (splashNeedsDocumentedSquare(sourceWidth, sourceHeight)) {
      console.warn(
        `Splash source assets/splash-screen.png is ${sourceWidth}x${sourceHeight}, below the documented ${SPLASH_CANVAS_SIZE}px square. Contained on ${APP_BACKGROUND} without redrawing.`
      );
    }

    execFileSync(
      process.execPath,
      [
        path.join(root, 'node_modules/@capacitor/assets/bin/capacitor-assets'),
        'generate',
        '--ios',
        '--android',
        '--assetPath',
        stagingRelative,
        '--iconBackgroundColor',
        APP_BACKGROUND,
        '--iconBackgroundColorDark',
        APP_BACKGROUND,
        '--splashBackgroundColor',
        APP_BACKGROUND,
        '--splashBackgroundColorDark',
        APP_BACKGROUND,
      ],
      { cwd: root, stdio: 'inherit' }
    );

    await containArtwork(
      path.join(root, nativeAssetSources.splashIcon),
      path.join(root, androidSplashIconRelativePath),
      1024,
      android12SplashScale()
    );

    const splashImageset = path.join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
    const splashFiles = await fs.promises.readdir(splashImageset);
    for (const file of splashFiles) {
      if (!file.endsWith('.png')) continue;
      const full = path.join(splashImageset, file);
      const resized = await sharp(full)
        .resize(1366, 1366, { fit: 'fill' })
        .png({ compressionLevel: 9 })
        .toBuffer();
      await fs.promises.writeFile(full, resized);
    }

    const storyboardPath = path.join(root, 'ios/App/App/Base.lproj/LaunchScreen.storyboard');
    await fs.promises.writeFile(storyboardPath, launchStoryboardXml());

    const stylesPath = path.join(root, 'android/app/src/main/res/values/styles.xml');
    let styles = await fs.promises.readFile(stylesPath, 'utf8');
    if (!styles.includes('windowSplashScreenIconBackgroundColor')) {
      styles = styles.replace(
        '<item name="windowSplashScreenBackground">#fdde97</item>',
        '<item name="windowSplashScreenBackground">#fdde97</item>\n        <item name="android:windowSplashScreenIconBackgroundColor">#fdde97</item>'
      );
      await fs.promises.writeFile(stylesPath, styles);
    }

    for (const relativePath of [
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    ]) {
      const xmlPath = path.join(root, relativePath);
      const xml = await fs.promises.readFile(xmlPath, 'utf8');
      await fs.promises.writeFile(
        xmlPath,
        xml.replace(
          /(<background>\s*<inset android:drawable="@mipmap\/ic_launcher_background" android:inset=")[^"]*(")/,
          `$1${adaptiveBackgroundInset()}$2`
        )
      );
    }
  } finally {
    await fs.promises.rm(stagingDir, { recursive: true, force: true });
  }
}

module.exports = {
  APP_BACKGROUND,
  LAUNCH_IMAGE_CONTENT_MODE,
  SPLASH_CANVAS_SIZE,
  adaptiveBackgroundInset,
  androidSplashIconRelativePath,
  circleSafeScale,
  android12SplashScale,
  nativeAssetSources,
  splashNeedsDocumentedSquare,
  stageSources,
  launchStoryboardXml,
  generateNativeAssets,
};

if (require.main === module) {
  generateNativeAssets().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
