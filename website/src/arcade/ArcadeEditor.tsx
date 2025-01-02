import * as React from "react";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { MODELS } from "@site/src/arcade/models";
import * as q from "groqd-legacy";
import * as z from "zod";
import {
  ArcadeDispatch,
  getStorageValue,
  setStorageValue,
} from "@site/src/arcade/state";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import lzstring from "lz-string";
import { createTwoslashInlayProvider } from "../../../shared/util/twoslashInlays";
import { runCodeEmitter } from "@site/src/arcade/eventEmitters";
import { registerEditorShortcuts } from "@site/src/arcade/editorShortcuts";
import { useIsDarkMode } from "@site/src/arcade/useIsDarkMode";
import types from "../types.json";
import { createPlaygroundModule } from "./playground/playground-implementation";
import * as playgroundPokemonModule from "./playground/pokemon";
import * as playgroundTodoListModule from "./playground/todo-list";

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

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(
      types.extraLibs
    );
    monaco.languages.registerInlayHintsProvider(
      "typescript",
      createTwoslashInlayProvider()
    );

    const handleContentChange = debounce(() => runCode({ dispatch }), 500);
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
    runCode({ dispatch }).catch(console.error);

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
        return runCode({ dispatch, shouldRunQueryImmediately });
      }
    );

    return () => {
      runCodeEmitterHandle.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    monaco.editor.setTheme(prefersDark ? "vs-dark" : "vs");
  }, [prefersDark]);

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

    const libs = {
      groqd: q,
      zod: z,
      get playground() {
        return createPlaygroundModule({
          dispatch,
          shouldRunQueryImmediately,
        });
      },
      "playground/pokemon": playgroundPokemonModule,
      "playground/todo-list": playgroundTodoListModule,
    };
    const scope = {
      exports: {},
      require(name: keyof typeof libs) {
        if (!(name in libs)) {
          const supported = Object.keys(libs);
          throw new Error(
            `Cannot import "${name}"; you can only import supported modules (${supported
              .map((lib) => `"${lib}"`)
              .join(", ")})`
          );
        }
        return libs[name];
      },
    };
    executeCode(code, scope);
  } catch (err) {
    dispatch({
      type: "INPUT_EVAL_FAILURE",
      payload: { inputParseError: err },
    });
  }
};

function executeCode(code: string, scope: Record<string, unknown>) {
  const argNames = Object.keys(scope);
  const args = Object.values(scope);

  const fn = new Function(...argNames, code);
  fn(...args);
}
