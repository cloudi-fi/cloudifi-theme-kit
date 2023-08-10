import fs from 'fs';
import path from 'path';

import {
  manifestName,
  themeBaseUrl,
  createThemeFromManifest,
  readManifest,
  themeBaseFactory,
  themeDirsFactory,
} from './lib/theme-helpers.js';

import {
  compilers,
  compilingListFactory,
  prepareFactory,
  compileFactory,
  watchFactory,
} from './lib/compile-helpers.js';

const themes = {};

export function compileSass(themePath) {
  const themesDir = path.dirname(themePath);
  const themeName = path.basename(themePath);

  addTheme(themeName, themesDir);


  Object.entries(themes)
    .map(themeBaseFactory(themes))
    .map(themeDirsFactory(themes));

  let sassCompiler = ['sass', compilers.sass];

  compilingListFactory(themes)(sassCompiler);
  prepareFactory(themes)(sassCompiler);
  compileFactory(themes)(sassCompiler);

}

function addTheme(themeName, themesDir) {
  const manifestPath = path.join(themesDir, themeName, manifestName);
  const manifest = readManifest(manifestPath);

  themes[manifest.name] = {
    name: manifest.name,
    dir: path.join(themesDir, themeName),
    url: themeBaseUrl + manifest.name,
    manifest: manifest,
  };

  if (manifest.base) {
    addTheme(manifest.base, themesDir);
  }
}

