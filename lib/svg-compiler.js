import Promise from 'promise';
import fs from 'fs';
import svgo from 'svgo';

const svoProcess = new svgo({});

export default function svgCompiler(theme) {
  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
          throw err;
        }

        svoProcess.optimize(data, {path: inputFile}).then((result) => {
          if (result.data) {
            fs.writeFile(outputFile, result.data, (err) => {
              if (err) {
                throw err;
              }

              return resolve();
            });
          } else {
            console.error('Empty svg', outputFile);
            return resolve();
          }
        });
      });
    });
  };
}
