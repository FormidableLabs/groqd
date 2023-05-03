// This file is a modification of https://github.com/microsoft/TypeScript-Website/blob/afc55042b542f71e4f8341724294a5e35eb83ee7/packages/playground/src/twoslashInlays.ts
import * as monaco from "monaco-editor";

export const createTwoslashInlayProvider = () => {
  const provider: monaco.languages.InlayHintsProvider = {
    provideInlayHints: async (model, _, cancel) => {
      const editorText = model.getValue();
      const queryRegex = /(\n\s*\n)^(.*)runQuery\(/gm;
      let match;
      const results: monaco.languages.InlayHint[] = [];
      const worker = await (
        await monaco.languages.typescript.getTypeScriptWorker()
      )();

      if (model.isDisposed()) {
        return {
          hints: [],
          dispose: () => void {},
        };
      }

      while ((match = queryRegex.exec(editorText)) !== null) {
        const end = match.index + match[1].length + match[2].length;
        const endPos = model.getPositionAt(end);
        const inspectionPos = new monaco.Position(
          endPos.lineNumber,
          endPos.column
        );
        const inspectionOff = model.getOffsetAt(inspectionPos);

        if (cancel.isCancellationRequested) {
          return {
            hints: [],
            dispose: () => void {},
          };
        }

        const hint = (await worker.getQuickInfoAtPosition(
          "file://" + model.uri.path,
          inspectionOff
        )) as { displayParts: { text: string }[] };
        if (!hint || !hint.displayParts) continue;

        // Make a one-liner
        let text = hint.displayParts
          .map((d) => d.text)
          .join("")
          .replace(/\n/gm, " ")
          .replace(/  /g, "")
          .replace(/.*runQuery<(.+?)>.*/, "$1");
        if (text.length > 120) text = text.slice(0, 119) + "...";

        const inlay: monaco.languages.InlayHint = {
          position: new monaco.Position(
            endPos.lineNumber - 1,
            endPos.column + 1
          ),
          label: text,
          paddingLeft: true,
        };
        results.push(inlay);
      }

      return {
        hints: results,
        dispose: () => void {},
      };
    },
  };
  return provider;
};
