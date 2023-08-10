import Promise from 'promise';
import glob from 'glob';
import {
  manifestName,
  createThemeFromManifest,
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
import {
  symlinkFactory,
} from './lib/link-helpers.js';



export function compile() {
  const manifestFiles = glob.sync('**/' + manifestName);
  const themes = Object.fromEntries(manifestFiles.map(createThemeFromManifest));

  console.log('themes', themes);

  Object.entries(themes)
    .map(themeBaseFactory(themes))
    .map(themeDirsFactory(themes));

  return Promise.all(
    Object.entries(compilers)
      .map(compilingListFactory(themes))
      .map(prepareFactory(themes))
      .map(compileFactory(themes))
  );
}

export function watch() {
  const manifestFiles = glob.sync('**/' + manifestName);
  const themes = Object.fromEntries(manifestFiles.map(createThemeFromManifest));
  const watchableCompilers = ['sass', 'es'];

  compile().then((compilers) => {
    compilers
      .filter(([compilerName, compiler]) => watchableCompilers.indexOf(compilerName) > -1)
      .map(watchFactory(themes));
  });
}

export function link() {
  const manifestFiles = glob.sync('**/' + manifestName);
  const themes = Object.fromEntries(manifestFiles.map(createThemeFromManifest));

  Object.entries(themes)
    .map(symlinkFactory(themes));
}
