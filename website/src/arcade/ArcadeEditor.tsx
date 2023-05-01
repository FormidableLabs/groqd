import * as React from "react";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { MODELS } from "@site/src/arcade/models";
import types from "@site/src/types.json";
import * as q from "groqd";
import { ArcadeDispatch, State } from "@site/src/arcade/state";
import { evaluate, parse } from "groq-js";

export type ArcadeEditorProps = {
  dispatch: ArcadeDispatch;
  query: State["query"];
};

export type ArcadeEditorHandle = {
  setModel(model: keyof typeof MODELS): void;
  runQuery(): void;
};

export const ArcadeEditor = React.forwardRef(
  (
    { dispatch, query }: ArcadeEditorProps,
    ref: React.Ref<ArcadeEditorHandle>
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const activeModel = "ts";

    /**
     * Execute TS query code, generates a query to store in state
     */
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

    /**
     * Set up editor on mount
     */
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
        handleContentChange.cancel();
      };
    }, []);

    /**
     * Run the query that's in state.
     */
    const runQuery = React.useCallback(async () => {
      if (!query.query) return;
      //
      dispatch({ type: "START_QUERY_EXEC" });
      //
      let json: unknown;
      try {
        json = JSON.parse(MODELS.json.getValue());
      } catch {
        console.log("error parsing JSON");
        // TODO: alert error
      }

      const runner = q.makeSafeQueryRunner(async (query: string) => {
        const tree = parse(query);
        const _ = await evaluate(tree, { dataset: json });
        const rawResponse = await _.get();
        dispatch({ type: "RAW_RESPONSE_RECEIVED", payload: { rawResponse } });

        return rawResponse;
      });

      try {
        const data = await runner(query);
        dispatch({ type: "PARSE_SUCCESS", payload: { parsedResponse: data } });
      } catch (err) {
        const errorPaths = new Map(); // TODO: Generate these
        dispatch({
          type: "PARSE_FAILURE",
          payload: { fetchParseError: err, errorPaths },
        });
        console.error(err);
      }

      console.log(query.query);
    }, [query]);

    /**
     * Need a handle so that parent component can call methods here.
     *  A bit of an anti-pattern, but monaco-shenanigans needs to get isolated here
     *   so that SSG doesn't choke on client-side APIs from monaco.
     */
    React.useImperativeHandle(
      ref,
      () => {
        return {
          setModel(newModel: keyof typeof MODELS) {
            editorRef.current?.setModel(MODELS[newModel]);
          },
          runQuery,
        };
      },
      [runQuery]
    );

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
