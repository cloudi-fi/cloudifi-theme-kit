import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dot from 'dot-object';

const basedir = process.env.PWD;

export const themeBaseUrl = '/template/';
export const manifestName = 'cloudifi.json';

export function createThemeFromManifest(manifestFile) {
  const manifestPath = path.join(basedir, manifestFile);
  let manifest = readManifest(manifestPath);

  return [
    manifest.name,
    {
      name: manifest.name,
      dir: path.join(basedir, path.dirname(manifestFile)),
      url: themeBaseUrl + manifest.name,
      manifest: manifest,
    }
  ];
}

export function readManifest(manifestPath) {
  let manifest;

  if (!fs.existsSync(manifestPath)) {
    throw new Error('Unreadable manifest : ' + manifestPath);
  }

  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath));
  } catch(e) {
    throw new Error('Invalid JSON in manifest : ' + manifestPath);
  }

  if (!manifest.name) {
    throw new Error('Invalid manifest : ' + manifestPath);
  }

  return manifest;
}

export function themeBaseFactory(themes) {
  return ([themeName, theme]) => {
    if (!theme.manifest) {
      console.log('no manifest?', themeName);
    }
    if (!theme.manifest.base) {
      return [themeName, theme];
    }

    if(!(theme.manifest.base in themes)) {
      throw new Error('Missing base theme : ' + JSON.stringify(theme.manifest));
    }

    theme.base = themes[theme.manifest.base];

    return [themeName, theme];
  };
}

export function themeDirsFactory(themes) {
  return ([themeName, theme]) => {
    theme.dirs = getThemeDirs(theme);

    return [themeName, theme];
  };
}

export function themeManifestFactory(themes) {
  return ([themeName, theme]) => {
    theme.manifest = readManifest(path.join(theme.dir, manifestName));
  };
}

export function getThemeDirs(theme, dirs = []) {
  if (theme.dir) {
    dirs.push(theme.dir);
  }

  if (theme.base) {
    dirs = getThemeDirs(theme.base, dirs);
  }

  return dirs;
}

export function getThemeGlobs(theme, globs) {
  const themeGlobs = [];

  theme.dirs.forEach((dir) => {
    globs.forEach((glob) => {
      themeGlobs.push(path.join(dir, glob));
    });
  });

  return themeGlobs;
}

// Move to compile helpers
export function getThemeCompiledFiles(theme, watcherName, baseFallback) {
  const [compileDefinition, foundTheme] = findManifestVariable('compilers.' + watcherName, theme, baseFallback);

  if (!compileDefinition) {
    return [];
  }

  const compiledFiles = [];

  Object.entries(compileDefinition).forEach(([destination, sources]) => {
    if (typeof sources === 'string') {
      sources = [sources];
    }

    if (sources && sources.length) {
      sources.forEach((source) => {
        compiledFiles.push({
          source: source,
          destination: destination,
        });
      });
    }
  });

  return compiledFiles;
}

export function findThemeFile(file, theme, baseFallback = false, exclude = null) {
  if (!file) {
    console.log(chalk.red('Error : filename is empty'), theme.name);
  }

  if (fs.existsSync(file) && exclude !== file) {
    return [file, theme];
  }

  let filePath = path.join(theme.dir, file);

  if (fs.existsSync(filePath) && exclude !== filePath) {
    return [filePath, theme];
  }

  if (baseFallback && theme.base) {
    return findThemeFile(file, theme.base, baseFallback, exclude);
  }

  return [];
}

export function findManifestVariable(variable, theme, baseFallback) {
  const value = dot.pick(variable, theme.manifest);

  if (value !== undefined) {
    return [value, theme];
  }

  if (baseFallback && theme.base) {
    return findManifestVariable(variable, theme.base, baseFallback);
  }

  return [];
}
