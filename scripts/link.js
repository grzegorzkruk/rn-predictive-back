/**
 * Links the local checkouts of react-native, react-native-screens,
 * react-navigation, react-native-reanimated and react-native-worklets into
 * this app's node_modules, and links the tooling packages that only exist
 * inside the react-native monorepo.
 *
 * Run with `yarn link` (also runs automatically after `yarn install`).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const APP_ROOT = path.resolve(__dirname, '..');
const CALLSTACK = path.resolve(APP_ROOT, '..');
const NM = path.join(APP_ROOT, 'node_modules');

// Monorepo-local packages that are NOT published to npm at this version,
// so they must come from the react-native checkout.
const RN_REPO = path.join(CALLSTACK, 'react-native');
const RN_PACKAGES = path.join(RN_REPO, 'packages');

/** package name -> absolute source directory */
const LINKS = {
  'react-native': path.join(RN_PACKAGES, 'react-native'),
  'react-native-screens': path.join(CALLSTACK, 'react-native-screens'),
  'react-native-reanimated': path.join(
    CALLSTACK,
    'react-native-reanimated/packages/react-native-reanimated',
  ),
  'react-native-worklets': path.join(
    CALLSTACK,
    'react-native-reanimated/packages/react-native-worklets',
  ),

  '@react-navigation/core': path.join(CALLSTACK, 'react-navigation/packages/core'),
  '@react-navigation/elements': path.join(CALLSTACK, 'react-navigation/packages/elements'),
  '@react-navigation/native': path.join(CALLSTACK, 'react-navigation/packages/native'),
  '@react-navigation/native-stack': path.join(CALLSTACK, 'react-navigation/packages/native-stack'),
  '@react-navigation/routers': path.join(CALLSTACK, 'react-navigation/packages/routers'),
  '@react-navigation/stack': path.join(CALLSTACK, 'react-navigation/packages/stack'),

  '@react-native/codegen': path.join(RN_PACKAGES, 'react-native-codegen'),
  '@react-native/asset-utils': path.join(RN_PACKAGES, 'asset-utils'),
  '@react-native/babel-preset': path.join(RN_PACKAGES, 'react-native-babel-preset'),
  '@react-native/babel-transformer': path.join(RN_PACKAGES, 'react-native-babel-transformer'),
  '@react-native/community-cli-plugin': path.join(RN_PACKAGES, 'community-cli-plugin'),
  '@react-native/gradle-plugin': path.join(RN_PACKAGES, 'gradle-plugin'),
  '@react-native/metro-config': path.join(RN_PACKAGES, 'metro-config'),
  '@react-native/normalize-colors': path.join(RN_PACKAGES, 'normalize-color'),
  '@react-native/polyfills': path.join(RN_PACKAGES, 'polyfills'),
  '@react-native/virtualized-lists': path.join(RN_PACKAGES, 'virtualized-lists'),
};

/**
 * react-navigation resolves `@react-navigation/elements/internal` etc. through
 * a custom export condition. Metro is configured with that condition, but be
 * explicit so the app also works if the condition is ever dropped.
 */
const NAV_SOURCE_CONDITION = '@react-navigation/source';

function ensureSymlink(linkPath, targetPath) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `Missing source checkout for ${linkPath}: ${targetPath}\n` +
        'Check REPO LAYOUT in README.md, or edit scripts/link.js.',
    );
  }

  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });

  let stats = null;
  try {
    stats = fs.lstatSync(linkPath);
  } catch {
    // does not exist
  }

  if (stats != null) {
    if (stats.isSymbolicLink()) {
      const current = fs.readlinkSync(linkPath);
      if (path.resolve(parent, current) === targetPath) {
        return 'unchanged';
      }
      fs.unlinkSync(linkPath);
    } else if (stats.isDirectory()) {
      // npm installed a real copy of a package we want to link.
      fs.rmSync(linkPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(linkPath);
    }
  }

  fs.symlinkSync(targetPath, linkPath, 'junction');
  return 'linked';
}

function main() {
  if (!fs.existsSync(NM)) {
    console.error('node_modules is missing. Run `yarn install` first.');
    process.exit(1);
  }

  const results = [];
  for (const [name, target] of Object.entries(LINKS)) {
    const status = ensureSymlink(path.join(NM, name), target);
    results.push([status, name, target]);
  }

  for (const [status, name, target] of results) {
    const mark = status === 'linked' ? '\x1b[32m~\x1b[0m' : '\x1b[90m=\x1b[0m';
    console.log(`${mark} ${name.padEnd(34)} ${path.relative(CALLSTACK, target)}`);
  }

  console.log(`\nexport condition for react-navigation sources: ${NAV_SOURCE_CONDITION}`);
  console.log('Next: `yarn android` (see README.md for the first-time build notes).');
}

main();
