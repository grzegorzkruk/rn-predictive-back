'use strict';

const path = require('node:path');
const Module = require('node:module');

// The worklets plugin is loaded from the linked checkout. Node then resolves
// its @babel/* deps from that tree, which has no node_modules. Point it at
// this app's install.
const appNodeModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = [appNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
