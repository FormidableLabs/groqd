import * as React from "react";
import { MODELS } from "@site/src/arcade/models";

type ArcadeEditorTabsProps = {
  activeModel: keyof typeof MODELS;
  switchModel: (mode: keyof typeof MODELS) => void;
};

export function ArcadeEditorTabs({
  activeModel,
  switchModel,
}: ArcadeEditorTabsProps) {
  return (
    <div className="h-8 bg-red-100">
      <button onClick={() => switchModel("ts")} disabled={activeModel === "ts"}>
        TS
      </button>
      <button
        onClick={() => switchModel("json")}
        disabled={activeModel === "json"}
      >
        JSON
      </button>
    </div>
  );
}
