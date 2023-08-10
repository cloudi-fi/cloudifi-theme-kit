import Promise from 'promise';
import path from 'path';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

export default function imgCompiler(theme) {
  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      imagemin([inputFile], {
        destination: path.dirname(outputFile),
        plugins: [
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8]
          })
        ]
      }).then((err, files) => {
        return resolve();
      });
    });
  };
};
