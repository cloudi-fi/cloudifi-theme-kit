export default function noopCompiler(theme) {
  return (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
      return resolve();
    });
  };
};
