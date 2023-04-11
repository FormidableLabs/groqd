/* eslint @typescript-eslint/no-var-requires: 0 */
const { globSync } = require("glob");
const path = require("node:path");
const fs = require("node:fs/promises");

const main = async () => {
  await fs.writeFile(
    path.resolve(__dirname, "../src/types.json"),
    JSON.stringify({
      zod: await getTypeFiles("zod"),
      groqd: await getTypeFiles("groqd"),
    })
  );
};

const getTypeFiles = async (packageName) => {
  const BASE = path.resolve(__dirname, `../../../node_modules/${packageName}`);
  const typeFiles = globSync(path.join(BASE, "/**/*.d.ts"));
  const map = {};

  for (const typeFile of typeFiles) {
    map[typeFile.replace(BASE + "/", "")] = await fs.readFile(
      typeFile,
      "utf-8"
    );
  }

  return map;
};

main();
