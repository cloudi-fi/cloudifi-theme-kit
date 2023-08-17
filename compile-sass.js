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

export function compileSass(themesDir, targetThemes) {
  targetThemes.forEach((themeName) => {
    addTheme(themeName, themesDir);
  });

  Object.entries(themes)
    .map(themeBaseFactory(themes))
    .map(themeDirsFactory(themes));

  let sassCompiler = ['sass', compilers.sass];

  let compilingThemes = {};

  targetThemes.forEach((themeName) => {
    compilingThemes[themeName] = themes[themeName];
  });

  compilingListFactory(compilingThemes)(sassCompiler);
  prepareFactory(compilingThemes)(sassCompiler);
  compileFactory(compilingThemes)(sassCompiler);
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

