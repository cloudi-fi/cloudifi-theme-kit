import Promise from 'promise';
import fs from 'fs';
import sass from 'node-sass';
import sassUtilsFactory from 'node-sass-utils';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import {
  findThemeFile,
  findManifestVariable,
} from './theme-helpers.js';

const sassUtils = sassUtilsFactory(sass);
const postCssPlugins = [autoprefixer];

if (process.argv.indexOf('--no-min') < 0 && process.argv.indexOf('--no-minify') < 0) {
  postCssPlugins.push(cssnano({
    preset: 'default',
  }));
}

const postcssProcessor = postcss(postCssPlugins);

export default function sassCompiler(theme) {
  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      sass.render({
        file: inputFile,
        outFile: outputFile,
        outputStyle: 'expanded',
        functions: {
          'theme($var)': themeVarToSass,
          'asset($path)': assetToSass,
          // 'url($path)': (path) => {
          //   path = sassUtils.sassString(path);
          //   console.log('URL > ' , path);

          //   return castToSass('url(' + path + ')');
          // },
        },
        importer: [importFileToSass]
      }, (error, result) => {
        if (error) {
          throw error;
        }

        postcssProcessor.process(result.css, {
          from: inputFile,
          to: outputFile,
        }).then((result) => {
          result.warnings().forEach(warn => {
            console.warn(warn.toString())
          });

          fs.writeFile(outputFile, result.css, (err) => {
            if (err) {
              throw error;
            }

            if (result.map) {
              fs.writeFile(outputFile + '.map', result.map, resolve);
            } else {
              return resolve();
            }
          });
        });
      });
    });
  }

  function themeVarToSass(varName) {
    const [value, foundTheme] = findManifestVariable(sassUtils.sassString(varName), theme, true);

    return castToSass(value);
  }

  function assetToSass(asset) {
    asset = sassUtils.sassString(asset);

    const suffixMatch = /\?|\#/.exec(asset);
    const assetUrl = '/sass/' + (suffixMatch ? asset.substr(0, suffixMatch.index) : asset);
    const assetSuffix = suffixMatch ? asset.substr(suffixMatch.index) : '';
    const [assetPath, foundTheme] = findThemeFile(assetUrl, theme, true);

    if (!assetPath || !foundTheme) {
      // console.log(chalk.red('Not found : ' + asset));
      return castToSass(asset);
    }

    let themeUrl = foundTheme.url;

    // Cachebust
    themeUrl += '--' + Math.round(new Date().getTime()/1000);

    const assetAbsoluteUrl = themeUrl + assetPath.replace(foundTheme.dir, '') + assetSuffix;

    return castToSass(assetAbsoluteUrl);
  }

  function importFileToSass(url, prev, done, currentTheme) {
    currentTheme = currentTheme || theme;

    // console.log('currentTheme', currentTheme);

    if (url === 'parent' && currentTheme.base) {
      let parentUrl = prev.replace('.scss', '');

      currentTheme.dirs.forEach((dir) => {
        parentUrl = parentUrl.replace(dir + '/sass/', '');
      });

      return importFileToSass(parentUrl, prev, done, currentTheme.base);
    }

    let urlParts = url.split('/');
    let urlNormal = urlParts.join('/');
    urlParts[urlParts.length - 1] = '_' + urlParts[urlParts.length - 1];
    let urlPartial = urlParts.join('/');

    urlNormal = 'sass/' + urlNormal + '.scss';
    urlPartial = 'sass/' + urlPartial + '.scss';

    let [filePath, foundTheme] = findThemeFile(urlPartial, currentTheme, true, prev);

    if (filePath) {
      return done({ file: filePath });
    }

    [filePath, foundTheme] = findThemeFile(urlNormal, currentTheme, true, prev);

    if (filePath) {
      return done({ file: filePath });
    }

    done({
      file: url
    });
  }
}

function castToSass(value) {
  if (typeof value === 'string' && value.substr(0, 1) === '#') {
    try {
      value = hexToRgba(value);
      value = sass.types.Color(value);
    } catch (e) {
      value = sassUtils.castToSass(value);
    }
  } else {
    value = sassUtils.castToSass(value);
  }

  return value;
}

function hexToRgba(hex) {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    throw new Error(`Invalid hex: ${hex}`);
  }

  let c = hex.substring(1).split('');

  if (c.length == 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }

  c = `0xff${c.join('')}`

  return Number(c);
}
