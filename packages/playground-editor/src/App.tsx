import * as React from "react";
import * as monaco from "monaco-editor";
import { languages } from "monaco-editor";
import types from "./types.json";
import ScriptTarget = languages.typescript.ScriptTarget;
import * as q from "groqd";
import debounce from "lodash.debounce";
import { emitError, emitQuery } from "./messaging";

export function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  const runCode = React.useCallback(async () => {
    try {
      const editor = editorRef.current;
      if (!editor) throw new Error("Editor not yet instantiated");

      const model = editor.getModel();
      if (!model) throw new Error();

      const worker = await monaco.languages.typescript.getTypeScriptWorker();
      const client = await worker(model.uri);
      const emitResult = await client.getEmitOutput(model.uri.toString());
      const code = emitResult.outputFiles[0].text;

      let result = "";
      const libs = {
        groqd: q,
        playground: {
          runQuery: (query: { query: string }) => {
            try {
              result = query.query;
            } catch {}
          },
        },
      };
      //
      const scope = {
        exports: {},
        require: (name: keyof typeof libs) => libs[name],
      };
      const keys = Object.keys(scope);
      new Function(...keys, code)(
        ...keys.map((key) => scope[key as keyof typeof scope])
      );

      // Emit the result
      emitQuery(result);
    } catch (err) {
      console.error(err);
      emitError(err instanceof Error ? err.message : "");
    }
  }, []);

  const handleContentChange = React.useMemo(
    () => debounce(runCode, 300),
    [runCode]
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || editorRef.current) return;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      typeRoots: ["groqd", "zod"],
      target: ScriptTarget.ES5,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
    });

    const model = monaco.editor.createModel(
      INIT_VALUE,
      "typescript",
      monaco.Uri.parse("file:///main.ts")
    );

    const u = model.onDidChangeContent(handleContentChange);

    editorRef.current = monaco.editor.create(container, {
      model,
      language: "typescript",
      minimap: { enabled: false },
    });

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

    // Run the code on mount
    runCode().catch(console.error);

    return () => {
      u.dispose();
    };
  }, []);

  return (
    <div className="App">
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}></div>
    </div>
  );
}

const INIT_VALUE = [
  `import { runQuery } from "playground";`,
  `import { q } from "groqd";`,
  "",
  `const query = runQuery(\n\tq("*")\n\t.filterByType("employee")\n\t.slice(0, 10)\n\t.grab$({\n\t\tname: q.string()\n\t})\n);`,
].join("\n");

const extraLibs = [
  {
    content: `declare module "groqd" {${types.groqd["dist/index.d.ts"]}`,
    filePath: monaco.Uri.file(`/node_modules/groqd/dist/index.d.ts`).toString(),
  },
  {
    content: `
          declare module "playground" {
            import type { infer, ZodType, ZodNumber } from "zod";
            import type { BaseQuery } from "groqd";

            export const runQuery: <T extends any>(query: { schema: ZodType<T>; query: string }) => T;
          }
        `,
    filePath: monaco.Uri.file(
      `/node_modules/groqd-playground/index.d.ts`
    ).toString(),
  },
];

for (const [filename, content] of Object.entries<string>(types.zod)) {
  extraLibs.push({
    content: content,
    filePath: monaco.Uri.file(`/node_modules/zod/${filename}`).toString(),
  });
}
