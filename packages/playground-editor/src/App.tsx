import * as React from "react";
import * as monaco from "monaco-editor";
import { languages } from "monaco-editor";
import types from "./types.json";
import ScriptTarget = languages.typescript.ScriptTarget;
import debounce from "lodash.debounce";
import { emitError, emitInput, emitReady } from "./messaging";
import { useIsDarkMode } from "./useDarkMode";
import { createTwoslashInlayProvider } from "./twoslashInlays";
import lzstring from "lz-string";
import { z } from "zod";

export function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const prefersDark = useIsDarkMode();
  const originRef = React.useRef("");
  const [initPayload, setInitPayload] = React.useState<z.infer<
    typeof initEventSchema
  > | null>(null);

  const handleContentChange = React.useMemo(
    () =>
      debounce(
        () =>
          editorRef.current &&
          runCode(editorRef.current, { target: originRef.current }),
        500
      ),
    [runCode]
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !initPayload || editorRef.current) return;

    let initCode = initPayload.code;
    if (initCode) {
      initCode = lzstring.decompressFromEncodedURIComponent(initCode);
    }

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      typeRoots: ["groqd", "zod"],
      target: ScriptTarget.ES5,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
    });

    const model = monaco.editor.createModel(
      initCode || DEFAULT_INIT_CODE,
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

    // Cmd + Enter to run query
    editorRef.current?.addAction({
      id: "trigger-run",
      label: "Trigger playground fetch",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run(editor) {
        runCode(editor, {
          requestImmediateFetch: true,
          target: originRef.current,
        }).catch(console.error);
      },
    });

    // Cmd + S to copy URL to clipboard?
    editorRef.current?.addAction({
      id: "copy-url",
      label: "Copy URL to clipboard",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run(editor) {
        runCode(editor, { requestShareCopy: true, target: originRef.current });
      },
    });

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
    monaco.languages.registerInlayHintsProvider(
      "typescript",
      createTwoslashInlayProvider()
    );

    // Run the code on mount
    runCode(editorRef.current, { target: originRef.current }).catch(
      console.error
    );

    return () => {
      didChangeInstance.dispose();
    };
  }, [initPayload]);

  React.useEffect(() => {
    if (!editorRef.current) return;
    monaco.editor.setTheme(prefersDark ? "vs-dark" : "vs");
  }, [prefersDark]);

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.source !== window.parent) {
        return;
      }

      try {
        const payload = messageSchema.parse(JSON.parse(message.data));
        const editor = editorRef.current;

        if (payload.event === "INIT") {
          originRef.current = payload.origin;

          setInitPayload(payload);
        }

        if (editor && payload.event === "RESET_CODE") {
          editor.setValue(DEFAULT_INIT_CODE);
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    emitReady();

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}></div>
  );
}

const runCode = async (
  editor: monaco.editor.ICodeEditor,
  {
    requestImmediateFetch = false,
    requestShareCopy,
    target,
  }: {
    requestImmediateFetch?: boolean;
    requestShareCopy?: boolean;
    target: string;
  }
) => {
  try {
    if (!editor) throw new Error("Editor not yet instantiated");

    const model = editor.getModel();
    if (!model) throw new Error();

    const worker = await monaco.languages.typescript.getTypeScriptWorker();
    const client = await worker(model.uri);
    const emitResult = await client.getEmitOutput(model.uri.toString());
    const code = emitResult.outputFiles[0].text;

    emitInput(
      {
        code,
        requestImmediateFetch,
        requestShareCopy,
        compressedRawCode: lzstring.compressToEncodedURIComponent(
          editor.getValue()
        ),
      },
      target
    );
  } catch (err) {
    console.error(err);
    emitError(err instanceof Error ? err.message : "", target);
  }
};

// Initial code, will likely change in the future.
const DEFAULT_INIT_CODE = `
import { runQuery } from "playground";
import { q } from "groqd";

runQuery(
  q("*")
    .filter()
    .slice(0, 10)
    .grab$({
      _id: q.string()
    }),
	// params (optional)
  {}
);

`.trim();

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

const resetCodeEventSchema = z.object({
  event: z.literal("RESET_CODE"),
});

const initEventSchema = z.object({
  event: z.literal("INIT"),
  code: z.string().optional(),
  origin: z.string(),
});

const messageSchema = z.union([resetCodeEventSchema, initEventSchema]);
