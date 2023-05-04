import * as React from "react";
import * as monaco from "monaco-editor";
import { MODELS } from "@site/src/arcade/models";
import debounce from "lodash.debounce";
import {
  getStorageValue,
  isDatasetPresetKey,
  setStorageValue,
} from "@site/src/arcade/state";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import lzstring from "lz-string";
import datasets from "@site/src/datasets.json";

type ArcadeDatasetEditorProps = {};

export function ArcadeDatasetEditor({}: ArcadeDatasetEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || editorRef.current) return;

    const handleContentChange = debounce(() => {
      const qpValue = getStorageValue(ARCADE_STORAGE_KEYS.DATASET, true);

      const modelVal = MODELS.json.getValue();
      if (
        qpValue &&
        isDatasetPresetKey(qpValue) &&
        modelVal === datasets[qpValue].data
      ) {
        return;
      }

      setStorageValue(
        ARCADE_STORAGE_KEYS.DATASET,
        lzstring.compressToEncodedURIComponent(MODELS.json.getValue())
      );
    }, 1000);
    const didChangeInstance =
      MODELS.json.onDidChangeContent(handleContentChange);

    editorRef.current = monaco.editor.create(container, {
      model: MODELS.json,
      language: "json",
      fontSize: 13,
      automaticLayout: true,
      minimap: { enabled: false },
      formatOnPaste: true,
    });

    return () => {
      handleContentChange.cancel();
      didChangeInstance.dispose();
    };
  }, []);

  return <div className="absolute inset-0" ref={containerRef} />;
}
