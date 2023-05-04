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
} from "@site/src/arcade/state";
import { evaluate, parse } from "groq-js";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import lzstring from "lz-string";
import { createTwoslashInlayProvider } from "../../../shared/util/twoslashInlays";
import has from "lodash.has";
import { runCodeEmitter } from "@site/src/arcade/eventEmitters";
import { registerEditorShortcuts } from "@site/src/arcade/editorShortcuts";
import toast from "react-hot-toast";
import { useIsDarkMode } from "@site/src/arcade/useIsDarkMode";

export type ArcadeEditorProps = {
  dispatch: ArcadeDispatch;
};

export const ArcadeEditor = ({ dispatch }: ArcadeEditorProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const activeModel = "ts";
  const prefersDark = useIsDarkMode();

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
    monaco.languages.registerInlayHintsProvider(
      "typescript",
      createTwoslashInlayProvider()
    );

    const handleContentChange = debounce(
      () => runCode({ editor, dispatch }),
      500
    );
    const didChangeInstance = MODELS.ts.onDidChangeContent(handleContentChange);

    editorRef.current = monaco.editor.create(container, {
      model: MODELS[activeModel],
      language: "ts",
      fontSize: 13,
      theme: prefersDark ? "vs-dark" : "vs",
      automaticLayout: true,
      minimap: { enabled: false },
    });
    editor = editorRef.current;

    registerEditorShortcuts(editor);

    // Run code on start
    runCode({ editor, dispatch }).catch(console.error);

    return () => {
      handleContentChange.cancel();
      didChangeInstance.dispose();
    };
  }, []);

  React.useEffect(() => {
    const runCodeEmitterHandle = runCodeEmitter.subscribe(
      (shouldRunQueryImmediately) => {
        const editor = editorRef.current;
        if (!editor) return;
        return runCode({ dispatch, editor, shouldRunQueryImmediately });
      }
    );

    return () => {
      runCodeEmitterHandle.unsubscribe();
    };
  }, []);

  return <div className="absolute inset-0" ref={containerRef} />;
};

/**
 * Execute TS query code, generates a query to store in state
 * TODO: Make sure this only runs once. Cancel previous runs if this is called again.
 */
const runCode = async ({
  dispatch,
  shouldRunQueryImmediately = false,
}: {
  editor: monaco.editor.IStandaloneCodeEditor;
  dispatch: ArcadeDispatch;
  shouldRunQueryImmediately?: boolean;
}) => {
  try {
    const model = MODELS.ts;
    const worker = await monaco.languages.typescript.getTypeScriptWorker();
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
            toast.error("Failed to evaluate code.");
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
};

/**
 * Run a given query against dataset in the JSON model
 */
const runQuery = async ({
  query,
  dispatch,
}: {
  query: q.BaseQuery<any>;
  dispatch: ArcadeDispatch;
  params: GroqdQueryParams;
}) => {
  if (!query.query) return;
  dispatch({ type: "START_QUERY_EXEC" });

  try {
    let json: unknown;
    try {
      json = JSON.parse(MODELS.json.getValue());
    } catch {
      throw new Error("Error parsing dataset JSON");
    }

    // TODO: Handle params...
    const runner = q.makeSafeQueryRunner(async (query: string) => {
      const tree = parse(query);
      const _ = await evaluate(tree, { dataset: json });
      const rawResponse = await _.get();
      dispatch({ type: "RAW_RESPONSE_RECEIVED", payload: { rawResponse } });

      return rawResponse;
    });

    const data = await runner(query);
    dispatch({ type: "PARSE_SUCCESS", payload: { parsedResponse: data } });
  } catch (err) {
    let errorPaths: Map<string, string> | undefined;

    if (err instanceof q.GroqdParseError) {
      errorPaths = new Map();
      for (const e of err.zodError.errors) {
        if (e.message === "Required" && !has(err.rawResponse, e.path)) {
          errorPaths.set(
            e.path
              .slice(0, -1)
              .map((v) => String(v))
              .join("."),
            `Field "${e.path.at(-1)}" is Required`
          );
        } else {
          errorPaths.set(e.path.map((v) => String(v)).join("."), e.message);
        }
      }
    }

    dispatch({
      type: "PARSE_FAILURE",
      payload: { fetchParseError: err, errorPaths },
    });
  }
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
