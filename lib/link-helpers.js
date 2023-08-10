import Promise from 'promise';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import webpack from 'webpack';

const basedir = process.env.PWD;
const __dirname = dirname(fileURLToPath(import.meta.url));

export function symlinkFactory(themes) {
  const templatePath = findTemplatePath();

  return ([themeName, theme]) => {
    console.log('>>> ' + themeName);

    // source = chemin réel
    // target = chemin fictif
    const source = theme.dir;
    const target = path.join(templatePath, themeName);
    const sourceStats = fs.existsSync(source) ? fs.lstatSync(source) : null;

    if (!sourceStats || sourceStats.isSymbolicLink()) {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.blue('skipping'),
        chalk.yellow(source),
      );
    } else {
      symlink(source, target);
    }

    if (theme.manifest && theme.manifest.base && !(theme.manifest.base in themes)) {
      const baseThemeSource = path.join(templatePath, theme.manifest.base);
      const baseThemeTarget = path.join(path.dirname(theme.dir), theme.manifest.base);

      if (fs.existsSync(baseThemeSource)) {
        symlink(baseThemeSource, baseThemeTarget);

      } else {
        console.log(
          chalk.green(new Date().toJSON().substr(11,8)),
          chalk.red('missing base'),
          chalk.yellow(baseThemeSource),
        );
      }
    }

    return [themeName, theme];
  };
}

export function symlink(source, target) {
  const relativePath = path.relative(path.dirname(target), source);

  try {
    const targetStats = fs.existsSync(target) ? fs.lstatSync(target) : null;

    if (targetStats && (targetStats.isFile() || targetStats.isSymbolicLink() || targetStats.isDirectory())) {
      console.log(
        chalk.green(new Date().toJSON().substr(11,8)),
        chalk.red('remove'),
        chalk.yellow(target),
      );

      // console.log({
      //   isSymbolicLink: targetStats.isSymbolicLink(),
      //   isDirectory: targetStats.isDirectory(),
      //   isFile: targetStats.isFile()
      // });

      if (!targetStats.isSymbolicLink() && targetStats.isDirectory()) {
        fs.rmdirSync(target);
      } else {
        fs.unlinkSync(target);
      }
    }
  } catch (err) {
    console.error(err);
  }

  console.log(
    chalk.green(new Date().toJSON().substr(11,8)),
    chalk.blue('symlink'),
    chalk.yellow(target) +
    // chalk.blue(' ▸'),
    chalk.blue(' ▷'),
    chalk.yellow(relativePath),
  );

  fs.symlinkSync(relativePath, target);
}

export function findTemplatePath(currentPath) {
  currentPath = currentPath || basedir;

  if (path.basename(currentPath) === 'template') {
    return currentPath;
  }

  return findTemplatePath(path.dirname(currentPath));
}
