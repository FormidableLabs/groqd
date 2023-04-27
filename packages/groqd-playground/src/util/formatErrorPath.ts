export const formatErrorPath = (path: string) =>
  path.split(".").reduce((acc, el) => {
    if (!NumReg.test(el)) {
      return `${acc}.${el}`;
    }
    return `${acc}[${el}]`;
  }, "");

const NumReg = /\d+/;
