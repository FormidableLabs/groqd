import * as monaco from "monaco-editor";

const DEFAULT_INIT_CODE = `
import { runQuery } from "playground";
import { q } from "groqd";

runQuery(
  q("*")
    .filterByType("pokemon")
    .slice(0, 5)
    .grab$({
      _id: q.string(),
      name: q.string()
    }),
	// params (optional)
  {}
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
