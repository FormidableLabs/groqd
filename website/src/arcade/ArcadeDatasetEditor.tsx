import * as React from "react";
import * as monaco from "monaco-editor";
import { MODELS } from "@site/src/arcade/models";

type ArcadeDatasetEditorProps = {};

export function ArcadeDatasetEditor({}: ArcadeDatasetEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || editorRef.current) return;

    editorRef.current = monaco.editor.create(container, {
      model: MODELS.json,
      language: "json",
      fontSize: 15,
      automaticLayout: true,
      minimap: { enabled: false },
    });
  }, []);

  return <div className="flex-1" ref={containerRef} />;
}
