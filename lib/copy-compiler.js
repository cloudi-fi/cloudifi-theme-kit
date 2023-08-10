import Promise from 'promise';
import fs from 'fs';

export default function copyCompiler(theme) {
  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      fs.copyFileSync(inputFile, outputFile);

      return resolve();
    });
  };
}
