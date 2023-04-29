import * as React from "react";
import * as monaco from "monaco-editor";
import { ArcadeHeader } from "@site/src/arcade/ArcadeHeader";
import Split from "@uiw/react-split";
import { ArcadeEditorTabs } from "@site/src/arcade/ArcadeEditorTabs";
import { ArcadeQueryDisplay } from "@site/src/arcade/ArcadeQueryDisplay";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { MODELS } from "@site/src/arcade/models";
import { reducer } from "@site/src/arcade/state";
import types from "@site/src/types.json";
import debounce from "lodash.debounce";
import * as q from "groqd";

export default function Arcade() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const [{ activeModel, query }, dispatch] = React.useReducer(reducer, {
    activeModel: "ts",
    query: q.q(""),
  });

  const runCode = React.useRef(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const model = MODELS.ts;
      const worker = await monaco.languages.typescript.getTypeScriptWorker();
      const client = await worker(model.uri);
      const emitResult = await client.getEmitOutput(model.uri.toString());
      const code = emitResult.outputFiles[0].text;

      let playgroundRunQueryCount = 0;
      const libs = {
        groqd: q,
        playground: {
          runQuery: (
            query: q.BaseQuery<any>,
            params?: Record<string, string | number>
          ) => {
            playgroundRunQueryCount++;
            if (playgroundRunQueryCount > 1) return;

            try {
              if (query instanceof q.BaseQuery) {
                dispatch({
                  type: "INPUT_EVAL_SUCCESS",
                  payload: { query, params },
                });
                console.log(query);
              }
            } catch {}
          },
        },
      };
      const scope = {
        exports: {},
        require: (name: keyof typeof libs) => libs[name],
      };
      const keys = Object.keys(scope);
      new Function(...keys, code)(
        ...keys.map((key) => scope[key as keyof typeof scope])
      );
    } catch {}
  });

  // On mount, setup the editor.
  React.useEffect(() => {
    const container = containerRef.current;
    const editor = editorRef.current;

    if (!container || editor) return;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      typeRoots: ["groqd", "zod"],
      target: monaco.languages.typescript.ScriptTarget.ES5,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
    });

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

    const handleContentChange = debounce(runCode.current, 500);
    const didChangeInstance = MODELS.ts.onDidChangeContent(handleContentChange);

    editorRef.current = monaco.editor.create(container, {
      model: MODELS[activeModel],
      language: "json",
      fontSize: 14,
      automaticLayout: true,
      minimap: { enabled: false },
    });

    // Run code on start
    runCode.current().catch(console.error);

    return () => {
      didChangeInstance.dispose();
    };
  }, []);

  const switchModel = (newModel: keyof typeof MODELS) => {
    const editor = editorRef.current;
    if (!editor) return;

    dispatch({ type: "SET_ACTIVE_MODEL", payload: newModel });
    editor.setModel(MODELS[newModel]);
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <ArcadeHeader />
      <Split className="flex-1">
        <div style={{ width: "50%" }} className="flex flex-col">
          <ArcadeEditorTabs
            activeModel={activeModel}
            switchModel={switchModel}
          />
          <div ref={containerRef} className="flex-1" />
          <ArcadeQueryDisplay query={query.query} />
        </div>
        <div style={{ width: "50%" }}>
          <ArcadeLoadingIndicator />
        </div>
      </Split>
    </div>
  );
}

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
