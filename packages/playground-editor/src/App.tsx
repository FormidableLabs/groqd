import * as React from "react";
import * as monaco from "monaco-editor";
import { languages } from "monaco-editor";
import types from "./types.json";
import ScriptTarget = languages.typescript.ScriptTarget;
import debounce from "lodash.debounce";
import { emitError, emitInput } from "./messaging";
import { useIsDarkMode } from "./useDarkMode";
import { createTwoslashInlayProvider } from "./twoslashInlays";

export function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const prefersDark = useIsDarkMode();

  const handleContentChange = React.useMemo(
    () => debounce(() => editorRef.current && runCode(editorRef.current), 300),
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

    const didChangeInstance = model.onDidChangeContent(handleContentChange);

    editorRef.current = monaco.editor.create(container, {
      model,
      language: "typescript",
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      theme: prefersDark ? "vs-dark" : "vs",
      fontSize: 13,
    });

    editorRef.current?.addAction({
      id: "trigger-run",
      label: "My label!",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run(editor) {
        runCode(editor, true).catch(console.error);
      },
    });

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
    monaco.languages.registerInlayHintsProvider(
      "typescript",
      createTwoslashInlayProvider()
    );

    // Run the code on mount
    runCode(editorRef.current).catch(console.error);

    return () => {
      didChangeInstance.dispose();
    };
  }, []);

  React.useEffect(() => {
    if (!editorRef.current) return;
    monaco.editor.setTheme(prefersDark ? "vs-dark" : "vs");
  }, [prefersDark]);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}></div>
  );
}

const runCode = async (
  editor: monaco.editor.ICodeEditor,
  requestImmediateFetch = false
) => {
  try {
    if (!editor) throw new Error("Editor not yet instantiated");

    const model = editor.getModel();
    if (!model) throw new Error();

    const worker = await monaco.languages.typescript.getTypeScriptWorker();
    const client = await worker(model.uri);
    const emitResult = await client.getEmitOutput(model.uri.toString());
    const code = emitResult.outputFiles[0].text;

    emitInput({ code, requestImmediateFetch });
  } catch (err) {
    console.error(err);
    emitError(err instanceof Error ? err.message : "");
  }
};

// Initial code, will likely change in the future.
const INIT_VALUE = [
  `import { runQuery } from "playground";`,
  `import { q } from "groqd";`,
  "",
  `const query = runQuery(\n\tq("*")\n\t.filterByType("employee")\n\t.slice(0, 10)\n\t.grab$({\n\t\tname: q.string(),\n\t\tjobTitle: q.string()\n\t})\n);`,
].join("\n");

// Adding in groqd types, and our custom playground.runQuery helper.
const extraLibs = [
  {
    content: `declare module "groqd" {${types.groqd["index.d.ts"]}`,
    filePath: monaco.Uri.file(`/node_modules/groqd/dist/index.d.ts`).toString(),
  },
  {
    content: `
          declare module "playground" {
            import type { infer, ZodType, ZodNumber } from "zod";
            import type { BaseQuery } from "groqd";

            export const runQuery: <T extends any>(
              query: { schema: ZodType<T>; query: string },
              params?: Record<string, string|number>
             ) => T;
          }
        `,
    filePath: monaco.Uri.file(
      `/node_modules/groqd-playground/index.d.ts`
    ).toString(),
  },
];

// And don't forget the zod types.
for (const [filename, content] of Object.entries<string>(types.zod)) {
  extraLibs.push({
    content: content,
    filePath: monaco.Uri.file(`/node_modules/zod/${filename}`).toString(),
  });
}
