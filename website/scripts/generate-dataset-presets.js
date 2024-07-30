const fs = require("node:fs/promises");
const path = require("node:path");

const main = async () => {
  const allDatasets = await fs.readdir(path.resolve(__dirname, "./datasets"));

  const datasetData = {};
  for (const ds of allDatasets) {
    const id = path.parse(ds).name;
    if (name.endsWith(".ts")) continue;
    const { title, data } = require(path.resolve(__dirname, "datasets", ds))();
    datasetData[id] = { title, data: JSON.stringify(data, null, 2) };
  }

  await fs.writeFile(
    path.resolve(__dirname, "../src/datasets.json"),
    JSON.stringify(datasetData, null, 2)
  );

  console.log(`Wrote ${allDatasets.length} dataset files.`);
};

main().catch(console.error);
