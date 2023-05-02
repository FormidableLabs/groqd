import * as React from "react";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { MODELS } from "@site/src/arcade/models";
import types from "@site/src/types.json";
import * as q from "groqd";
import {
  ArcadeDispatch,
  getStorageValue,
  GroqdQueryParams,
  setStorageValue,
  State,
} from "@site/src/arcade/state";
import { evaluate, parse } from "groq-js";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import lzstring from "lz-string";
import datasets from "@site/src/datasets.json";

export type ArcadeEditorProps = {
  dispatch: ArcadeDispatch;
  query: State["query"];
  params: State["params"];
};

export type ArcadeEditorHandle = {
  setModel(model: keyof typeof MODELS): void;
  runQuery: typeof runQuery;
  fetchDatasetPreset: typeof fetchDatasetPreset;
};

export const ArcadeEditor = React.forwardRef(
  (
    { dispatch, query, params }: ArcadeEditorProps,
    ref: React.Ref<ArcadeEditorHandle>
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const activeModel = "ts";

    /**
     * Execute TS query code, generates a query to store in state
     * TODO: Make sure this only runs once. Cancel previous runs if this is called again.
     */
    const runCode = React.useRef(
      async ({
        shouldRunQueryImmediately = false,
      }: { shouldRunQueryImmediately?: boolean } = {}) => {
        const editor = editorRef.current;
        if (!editor) return;

        try {
          const model = MODELS.ts;
          const worker =
            await monaco.languages.typescript.getTypeScriptWorker();
          const client = await worker(model.uri);
          const emitResult = await client.getEmitOutput(model.uri.toString());
          const code = emitResult.outputFiles[0].text;

          // write the raw code to query params
          setStorageValue(
            ARCADE_STORAGE_KEYS.CODE,
            lzstring.compressToEncodedURIComponent(model.getValue())
          );

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

                    if (shouldRunQueryImmediately)
                      runQuery({ query, params, dispatch });
                  }
                } catch {
                  // TODO: Should we handle this case? Maybe just emit a toast?
                }
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
      }
    );

    /**
     * Set up editor on mount
     */
    React.useEffect(() => {
      const container = containerRef.current;
      let editor = editorRef.current;

      if (!container || editor) return;

      // Pull initial code
      const storedCode = getStorageValue(ARCADE_STORAGE_KEYS.CODE);
      if (storedCode) {
        MODELS.ts.setValue(
          lzstring.decompressFromEncodedURIComponent(storedCode)
        );
      }

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        typeRoots: ["groqd", "zod"],
        target: monaco.languages.typescript.ScriptTarget.ES5,
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
      });

      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

      const handleContentChange = debounce(() => runCode.current(), 500);
      const didChangeInstance =
        MODELS.ts.onDidChangeContent(handleContentChange);

      editorRef.current = monaco.editor.create(container, {
        model: MODELS[activeModel],
        language: "json",
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false },
      });
      editor = editorRef.current;

      // Cmd + Enter to run query
      editor.addAction({
        id: "trigger-run-query",
        label: "Trigger Arcard query run",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run() {
          runCode.current({ shouldRunQueryImmediately: true });
        },
      });

      // Run code on start
      runCode.current().catch(console.error);

      return () => {
        didChangeInstance.dispose();
        handleContentChange.cancel();
      };
    }, []);

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
          fetchDatasetPreset,
        };
      },
      [runQuery]
    );

    /**
     * TEMPORARY:
     * Fetch pokemon dataset for example usage.
     */
    React.useEffect(() => {
      const base = window.location.href.replace(
        /(.*open-source\/groqd)\/(.*)/,
        "$1/datasets/pokemon.json"
      );

      fetch(base)
        .then((res) => res.json())
        .then((json) => {
          MODELS.json.setValue(JSON.stringify(json, null, 2));
        });
    }, []);

    return <div className="flex-1" ref={containerRef} />;
  }
);

/**
 * Run a given query against dataset in the JSON model
 */
const runQuery = async ({
  query,
  dispatch,
  params,
}: {
  query: q.BaseQuery<any>;
  dispatch: ArcadeDispatch;
  params: GroqdQueryParams;
}) => {
  if (!query.query) return;
  dispatch({ type: "START_QUERY_EXEC" });
  //
  let json: unknown;
  try {
    json = JSON.parse(MODELS.json.getValue());
  } catch {
    console.log("error parsing JSON");
    // TODO: alert error
  }

  // TODO: Handle params...
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
};

const fetchDatasetPreset = ({
  datasetPreset,
  dispatch,
}: {
  datasetPreset: keyof typeof datasets;
  dispatch: ArcadeDispatch;
}) => {
  const base = window.location.href.replace(
    /(.*open-source\/groqd)\/(.*)/,
    `$1/datasets/${datasetPreset}.json`
  );

  fetch(base)
    .then((res) => res.json())
    .then((json) => {
      MODELS.json.setValue(JSON.stringify(json, null, 2));
    })
    .finally(() => {
      dispatch({ type: "FINISH_DATASET_FETCH" });
    });
};

/**
 * Adding in groqd types, and our custom playground.runQuery helper.
 */
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
