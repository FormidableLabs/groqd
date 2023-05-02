const fs = require("node:fs/promises");
const path = require("node:path");

const main = async () => {
  const allDatasets = await fs.readdir(path.resolve(__dirname, "./datasets"));

  const datasetMeta = {};
  for (const ds of allDatasets) {
    const id = path.parse(ds).name;
    const { title, data } = require(path.resolve(__dirname, "datasets", ds))();
    datasetMeta[id] = { title };

    await fs.writeFile(
      path.resolve(__dirname, "../static/datasets", `${id}.json`),
      JSON.stringify(data)
    );
  }

  await fs.writeFile(
    path.resolve(__dirname, "../src/datasets.json"),
    JSON.stringify(datasetMeta, null, 2)
  );

  console.log(`Wrote ${allDatasets.length} dataset files.`);
};

main().catch(console.error);
