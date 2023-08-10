import Promise from 'promise';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import glob from 'glob';
import esCompiler from './es-compiler.js';
import copyCompiler from './copy-compiler.js';
import sassCompiler from './sass-compiler.js';
import svgCompiler from './svg-compiler.js';
import imgCompiler from './img-compiler.js';
import noopCompiler from './noop-compiler.js';
import {
  manifestName,
  themeManifestFactory,
  findThemeFile,
  getThemeGlobs,
  getThemeCompiledFiles,
} from './theme-helpers.js';

const basedir = process.env.PWD;

export const compilers = {
  copy: {
    factory: copyCompiler,
  },
  svg: {
    factory: svgCompiler,
    globs: ['img/**/*.svg'],
    findBaseConf: true,
  },
  img: {
    factory: imgCompiler,
    globs: ['img/**/*.{jpg,png}'],
    findBaseConf: true,
  },
  sass: {
    factory: sassCompiler,
    globs: ['sass/**/*.scss', manifestName],
    findBaseConf: true,
    findBaseFile: true,
  },
  es: {
    factory: esCompiler,
    globs: ['es/**/*.js', manifestName],
    findBaseConf: true,
  },
};


export function compilingListFactory(themes) {
  return ([compilerName, compiler]) => {
    compiler.list = [];

    for (const [themeName, theme] of Object.entries(themes)) {
      const files = getThemeCompiledFiles(theme, compilerName, compiler.findBaseConf);
      const globs = compiler.globs ? getThemeGlobs(theme, compiler.globs) : null;

      if (!files.length) {
        continue;
      }

      compiler.list.push({
        theme: theme,
        globs: globs,
        files: files,
      });
    }

    return [compilerName, compiler];
  };
}

export function logCompilingFiles(compilerName, inputFile, outputFile) {
  console.log(
    chalk.green(new Date().toJSON().substr(11,8)),
    chalk.blue(compilerName),
    chalk.yellow(inputFile.replace(basedir + '/', './')) +
    // chalk.blue(' ▸'),
    chalk.blue(' ▷'),
    chalk.yellow(outputFile.replace(basedir + '/', './'))
  );
}

export function prepareCompilingFile(theme, inputFile, outputFile, baseFallback) {
  let [foundInputFile, foundTheme] = findThemeFile(inputFile, theme, baseFallback);

  outputFile = path.join(theme.dir, outputFile);

  if (!foundInputFile) {
    return [];
  }

  if (!fs.existsSync(path.dirname(outputFile))) {
    fs.mkdirSync(path.dirname(outputFile));
  }

  return [foundInputFile, outputFile];
}

// Prepare compile & watch methods
export function prepareFactory(themes) {
  return ([compilerName, compiler]) => {
    compiler.list.map((item) => {
      const compileFn = compiler.factory(item.theme);

      item.compile = (changedFile) => {
        if (changedFile) {
          item.theme.dirs.forEach((dir) => {
            changedFile = changedFile.replace(dir + '/', '');
          });
        }

        const compilations = [];

        item.files.forEach((file) => {
          // Sometimes we just need to compile the changed file
          let source = !file.source || file.source === '*' ? changedFile : file.source;
          let destination = !file.destination || file.destination === '*' ? changedFile : file.destination;

          if (!source || !destination) {
            return;
          }

          [source, destination] = prepareCompilingFile(item.theme, source, destination, compiler.findBaseFile);

          if (!source || !destination) {
            return;
          }

          logCompilingFiles(compilerName, source, destination);
          compilations.push(compileFn(source, destination));
        });

        return Promise.all(compilations);
      };

      item.watch = () => {
        if (!item.globs) {
          console.error('This should never happen');
          return;
        }

        item.watcher = chokidar.watch(item.globs, {
          ignored: /node_modules/,
          ignoreInitial: true,
          interval: 100,
        }).on('all', (event, filePath) => {
          // Re-read manifests if it changed
          if (filePath.match(/cloudifi\.json/)) {
            Object.entries(themes).map(themeManifestFactory(themes));
          }

          item.compile(filePath)

          // I hate that hack for self compiled files...
          // item.watcher.unwatch(filePath);
          // item.compile(filePath).then(() => {
          //   item.watcher.add(filePath);
          // });
        });
      };
    });

    return [compilerName, compiler];
  };
}

export function compileFactory(themes) {
  return ([compilerName, compiler]) => {
    let compilations = [];

    if (!compiler.list.length) {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.red.bold('No ' + compilerName + ' to compile...'),
      );
    } else {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.blue.bold('Compiling ' + compilerName + '...'),
      );

      for (let item of compiler.list) {
        const globCompile = item.files.filter((file) => file.source === '*' && file.destination === '*').length;

        if (globCompile) {
          let files = [];

          compiler.globs.forEach((compilerGlob) => {
            files = files.concat(glob.sync(compilerGlob, {cwd: item.theme.dir}));
          });

          for (let file of files) {
            compilations.push(item.compile(file));
          }
        }

        compilations.push(item.compile());
      }
    }

    return new Promise((resolve, reject) => {
      Promise.all(compilations).then(() => {
        resolve([compilerName, compiler]);
      });
    });
  }
}

export function watchFactory(themes) {
  return ([compilerName, compiler]) => {
    if (!compiler.globs) {
      return;
    }

    if (!compiler.list.length) {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.red.bold('No ' + compilerName + ' to watch...'),
      );
    } else {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.blue.bold('Watching ' + compilerName + '...'),
      );
      compiler.list.forEach((item) => item.watch());
    }

    return [compilerName, compiler];
  };
}

