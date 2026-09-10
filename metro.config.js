/**
 * Metro config for the predictive-back scratch app.
 *
 * Three checkouts are linked into node_modules as symlinks by scripts/link.js:
 *   react-native            -> ../react-native/packages/react-native
 *   react-native-screens    -> ../react-native-screens
 *   react-navigation        -> ../react-navigation/packages/*
 *
 * watchFolders must list every linked root, otherwise Metro does not see edits
 * made in those repos.
 */

const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const CALLSTACK = path.resolve(__dirname, '..');
const RN_REPO = path.join(CALLSTACK, 'react-native');
const NAV_PACKAGES = path.join(CALLSTACK, 'react-navigation', 'packages');

/**
 * react-navigation ships compiled `lib/` but its sources are only reachable
 * through the custom `@react-navigation/source` export condition. Map the
 * package root to `src/index.tsx` (and `/internal` to `src/internal.tsx`)
 * directly, so edits in the react-navigation checkout are picked up without a
 * build step. Scoped to these packages to avoid touching RN / screens.
 */
const NAV_SOURCE_ENTRIES = {
  '@react-navigation/core': path.join(NAV_PACKAGES, 'core'),
  '@react-navigation/elements': path.join(NAV_PACKAGES, 'elements'),
  '@react-navigation/native': path.join(NAV_PACKAGES, 'native'),
  '@react-navigation/native-stack': path.join(NAV_PACKAGES, 'native-stack'),
  '@react-navigation/routers': path.join(NAV_PACKAGES, 'routers'),
  '@react-navigation/stack': path.join(NAV_PACKAGES, 'stack'),
};

function resolveNavSource(moduleName) {
  for (const [packageName, packageDir] of Object.entries(NAV_SOURCE_ENTRIES)) {
    if (moduleName === packageName) {
      return path.join(packageDir, 'src', 'index.tsx');
    }
    if (moduleName === `${packageName}/internal`) {
      return path.join(packageDir, 'src', 'internal.tsx');
    }
  }
  return null;
}

const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
const config = {
  // Metro only crawls files under these roots. Anything resolved through a
  // symlink to a directory outside this list fails with "could not be found",
  // so every workspace package reachable from the bundle has to appear here.
  watchFolders: [
    // Carries node_modules that react-native itself depends on.
    path.join(RN_REPO, 'node_modules'),
    // Workspace packages that RN's JavaScript imports at runtime.
    path.join(RN_REPO, 'packages', 'react-native'),
    path.join(RN_REPO, 'packages', 'asset-utils'),
    path.join(RN_REPO, 'packages', 'assets-registry'),
    path.join(RN_REPO, 'packages', 'normalize-color'),
    path.join(RN_REPO, 'packages', 'polyfills'),
    path.join(RN_REPO, 'packages', 'virtualized-lists'),
    path.join(CALLSTACK, 'react-native-screens'),
    NAV_PACKAGES,
  ],

  resolver: {
    // Files inside the linked checkouts resolve their own `react`,
    // `react-native`, `warn-once`, `nanoid`, ... from their own directory, which
    // would give a second copy of react (invalid hook call) or miss a dep
    // entirely. Searching the app's node_modules last fixes both.
    nodeModulesPaths: [
      'node_modules',
      path.join(__dirname, 'node_modules'),
      path.join(RN_REPO, 'node_modules'),
    ],

    extraNodeModules: {
      'react-native': path.join(RN_REPO, 'packages', 'react-native'),
      react: path.join(__dirname, 'node_modules', 'react'),
    },

    // node_modules of the linked monorepos must not be walked into blindly.
    blockList: [
      pathToRegex(path.join(RN_REPO, 'packages', 'react-native', 'sdks')),
      pathToRegex(path.join(RN_REPO, 'packages', 'rn-tester')),
      pathToRegex(path.join(RN_REPO, 'private')),
      pathToRegex(path.join(CALLSTACK, 'react-native-screens', 'FabricExample')),
      pathToRegex(path.join(CALLSTACK, 'react-native-screens', 'TVOSExample')),
      pathToRegex(path.join(CALLSTACK, 'react-native-screens', 'apps')),
      pathToRegex(path.join(CALLSTACK, 'react-navigation', 'example')),
    ],

    resolveRequest: (context, moduleName, platform) => {
      const navSource = resolveNavSource(moduleName);
      if (navSource != null) {
        return context.resolveRequest(context, navSource, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

function pathToRegex(absolutePath) {
  const escaped = absolutePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}${path.sep === '\\' ? '\\\\' : '/'}.*$`);
}

module.exports = mergeConfig(defaultConfig, config);
