#!/usr/bin/env node --experimental-modules
import {
  compile,
  watch,
  link,
} from './index.js';

import {
  compileSass,
} from './compile-sass.js';

const [,, ...args] = process.argv;

if (args.indexOf('link') > -1 || args.indexOf('ln') > -1) {
  link();
} else if (args.indexOf('compile') > -1) {
  compile();
} else if (args.indexOf('compile-sass') > -1) {
  compileSass(args[1], args[2].split(','));
} else {
  // link();
  watch();
}
