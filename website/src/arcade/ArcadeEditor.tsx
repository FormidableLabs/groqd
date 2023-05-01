import * as React from "react";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { MODELS } from "@site/src/arcade/models";
import types from "@site/src/types.json";
import * as q from "groqd";
import { ArcadeDispatch } from "@site/src/arcade/state";

export type ArcadeEditorProps = {
  dispatch: ArcadeDispatch;
};

export type ArcadeEditorHandle = {
  setModel(model: keyof typeof MODELS): void;
};

export const ArcadeEditor = React.forwardRef(
  ({ dispatch }: ArcadeEditorProps, ref: React.Ref<ArcadeEditorHandle>) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const activeModel = "ts";

    const runCode = React.useCallback(async () => {
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
    }, []);

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

      const handleContentChange = debounce(runCode, 500);
      const didChangeInstance =
        MODELS.ts.onDidChangeContent(handleContentChange);

      editorRef.current = monaco.editor.create(container, {
        model: MODELS[activeModel],
        language: "json",
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false },
      });

      // Run code on start
      runCode().catch(console.error);

      return () => {
        didChangeInstance.dispose();
      };
    }, []);

    React.useImperativeHandle(ref, () => {
      return {
        setModel(newModel: keyof typeof MODELS) {
          editorRef.current?.setModel(MODELS[newModel]);
        },
      };
    });

    return <div className="flex-1" ref={containerRef} />;
  }
);

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

export type ArcadeEditorType = typeof ArcadeEditor;
