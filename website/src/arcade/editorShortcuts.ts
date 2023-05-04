import * as monaco from "monaco-editor";
import { copyShareUrl } from "@site/src/arcade/share";
import { runCodeEmitter } from "@site/src/arcade/eventEmitters";

export const registerEditorShortcuts = (
  editor: monaco.editor.IStandaloneCodeEditor
) => {
  editor.addAction({
    id: "trigger-run-query",
    label: "Trigger Arcard query run",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run() {
      runCodeEmitter.emit(true);
    },
  });

  editor.addAction({
    id: "copy-url-to-clipboard",
    label: "Copy Share URL to Clipboard",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run() {
      copyShareUrl();
    },
  });
};
