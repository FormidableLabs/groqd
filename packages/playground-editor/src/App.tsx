import * as React from "react";
import * as monaco from "monaco-editor";
import types from "./types.json";

export function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || editorRef.current) return;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      typeRoots: ["groqd", "zod"],
    });

    const model = monaco.editor.createModel(
      INIT_VALUE,
      "typescript",
      monaco.Uri.parse("file:///main.ts")
    );

    const extraLibs = [
      {
        content: `declare module "groqd" {${types.groqd["dist/index.d.ts"]}`,
        filePath: monaco.Uri.file(
          `/node_modules/groqd/dist/index.d.ts`
        ).toString(),
      },
    ];

    for (const [filename, content] of Object.entries<string>(types.zod)) {
      extraLibs.push({
        content: content,
        filePath: monaco.Uri.file(`/node_modules/zod/${filename}`).toString(),
      });
    }

    editorRef.current = monaco.editor.create(container, {
      model,
      language: "typescript",
      minimap: { enabled: false },
    });

    monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
  }, []);

  const handleClick = () => {
    console.log("boo");
  };

  return (
    <div className="App">
      <div>
        <button onClick={handleClick}>RUN ME</button>
      </div>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}></div>
    </div>
  );
}

const INIT_VALUE = [
  `import { q } from "groqd";`,
  `import type { InferType } from "groqd";`,
  "",
  `export const query = q("*")\n\t.filter()\n\t.grab$({ name: q.string() });`,
  "",
  `type Result = InferType<typeof query>;`,
].join("\n");
