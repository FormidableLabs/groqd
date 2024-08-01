import * as React from "react";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import * as q from "groqd";
import lzstring from "lz-string";
import { MODELS } from "@site/src/arcade/models";
import types from "@site/src/types.json";
import {
  ArcadeDispatch,
  getStorageValue,
  GroqdQueryParams,
  setStorageValue,
} from "@site/src/arcade/state";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import { runCodeEmitter } from "@site/src/arcade/eventEmitters";
import { registerEditorShortcuts } from "@site/src/arcade/editorShortcuts";
import { useIsDarkMode } from "@site/src/arcade/useIsDarkMode";
import { createTwoslashInlayProvider } from "../../../shared/util/twoslashInlays";
import * as groqBuilderPlaygroundPokemon from "./groq-builder-playground/pokemon";
import { createPlaygroundModule } from "./playground";

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

    const libs = {
      "./groq-builder-playground/pokemon": groqBuilderPlaygroundPokemon,
      groqd: q,
      playground: createPlaygroundModule({
        dispatch,
        shouldRunQueryImmediately,
      }),
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
  } catch {}
};

function executeCode(code: string, scope: Record<string, unknown>) {
  const keys = Object.keys(scope);
  const values = Object.values(scope);

  const fn = new Function(...keys, code);
  fn(...values);
}

/**
 * Adding in groqd types, and our custom playground.runQuery helper.
 */
const extraLibs = [
  ...getTypeLibs("groqd", types["groqd"]),
  ...getTypeLibs("playground", types["playground"]),
  ...getTypeLibs("groq-builder-playground", types["groq-builder-playground"]),
  ...getTypeLibs("zod", types.zod),
  ...getTypeLibs("groq-builder", types["groq-builder"]),
];

function getTypeLibs(moduleName: string, typeEntries: Record<string, string>) {
  return Object.entries<string>(typeEntries).map(([filename, content]) => ({
    content: content,
    filePath: monaco.Uri.file(
      `/node_modules/${moduleName}/${filename}`
    ).toString(),
  }));
}
