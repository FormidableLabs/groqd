import * as React from "react";
import * as monaco from "monaco-editor";

export default function Arcade() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  React.useEffect(() => {
    const container = containerRef.current;
    const editor = editorRef.current;

    if (!container || editor) return;

    const model = monaco.editor.createModel(
      "const x = 13;",
      "typescript",
      monaco.Uri.parse("file:///main.ts")
    );

    editorRef.current = monaco.editor.create(container, {
      model,
      language: "typescript",
    });
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <h1>Hello</h1>
    </div>
  );
}
