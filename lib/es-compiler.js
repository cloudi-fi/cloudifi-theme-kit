import Promise from 'promise';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import webpack from 'webpack';

const basedir = process.env.PWD;
const __dirname = dirname(fileURLToPath(import.meta.url));
let node_modules = path.join(__dirname, '../node_modules');

if (!fs.existsSync(path.join(node_modules, 'babel-loader'))) {
  node_modules = path.join(__dirname, '../..');
}

export default function esCompiler(theme) {
  const themeModulesPaths = [];

  theme.dirs.forEach((dir) => {
    themeModulesPaths.push(dir + '/es/');
    themeModulesPaths.push(dir + '/node_modules/');
  });

  themeModulesPaths.push(node_modules);

  console.log('themeModulesPaths', themeModulesPaths);
  console.log('node_modules', node_modules);

  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      webpack({
        entry: inputFile,
        output: {
          filename: path.basename(outputFile),
          path: path.dirname(outputFile),
        },
        optimization: {
          minimize: (process.argv.indexOf('--no-min') < 0 && process.argv.indexOf('--no-minify') < 0),
        },
        resolve: {
          modules: themeModulesPaths,
        },
        resolveLoader: {
          modules: [node_modules],
        },
        module: {
          rules: [{
            test: /\.(js)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    path.join(node_modules, '@babel/preset-env'),
                    {
                      targets: {
                        browsers: [
                          'last 2 versions',
                          '> 1%',
                          'iOS 7',
                        ]
                      }
                    }
                  ]
                ],
                plugins: [
                  // '@babel/plugin-transform-block-scoping',
                  '@babel/plugin-proposal-optional-chaining'
                ]
              }
            }
          }]
        },
      }, (err, stats) => {
        if (err) {
          console.error(err.stack || err);
        }

        if (stats.hasErrors()) {
          console.error(stats.toJson().errors);
        }

        return resolve();
      });
    });
  };
}
