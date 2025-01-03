import * as monaco from "monaco-editor";

const DEFAULT_INIT_CODE = `
runQuery(
  // TODO: Update DEFAULT_INIT_CODE
);

`.trim();

export const MODELS = {
  ts: monaco.editor.createModel(
    DEFAULT_INIT_CODE,
    "typescript",
    monaco.Uri.parse("file:///main.ts")
  ),

  json: monaco.editor.createModel(
    JSON.stringify([{ _id: "1234", firstName: "John" }], null, 2),
    "json",
    monaco.Uri.parse("file:///data.json")
  ),
};
