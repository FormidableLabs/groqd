import * as React from "react";
import { MODELS } from "@site/src/arcade/models";
import { reducer } from "@site/src/arcade/state";
import * as q from "groqd";
import { ArcadeHeader } from "@site/src/arcade/ArcadeHeader";
import Split from "@uiw/react-split";
import { ArcadeEditorTabs } from "@site/src/arcade/ArcadeEditorTabs";
import { ArcadeQueryDisplay } from "@site/src/arcade/ArcadeQueryDisplay";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { ArcadeSuccessView } from "@site/src/arcade/ArcadeSuccessView";
import BrowserOnly from "@docusaurus/BrowserOnly";
import type { ArcadeEditorType } from "@site/src/arcade/ArcadeEditor";

export default function Arcade() {
  const editorRef = React.useRef<React.ElementRef<ArcadeEditorType>>();
  const [
    {
      activeModel,
      query,
      isExecutingQuery,
      fetchParseError,
      parsedResponse,
      errorPaths,
    },
    dispatch,
  ] = React.useReducer(reducer, {
    activeModel: "ts",
    query: q.q(""),
    isExecutingQuery: false,
  });

  const setModel = (newModel: keyof typeof MODELS) => {
    const editor = editorRef.current;
    if (!editor) return;

    dispatch({ type: "SET_ACTIVE_MODEL", payload: newModel });
    editor.setModel(newModel);
  };

  const runQuery = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.runQuery();
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <ArcadeHeader>
        <button onClick={runQuery} disabled={!query.query}>
          Run query
        </button>
      </ArcadeHeader>
      <Split className="flex-1">
        <div style={{ width: "50%" }} className="flex flex-col">
          <ArcadeEditorTabs activeModel={activeModel} switchModel={setModel} />
          <BrowserOnly fallback={<ArcadeLoadingIndicator />}>
            {() => {
              const ArcadeEditor: ArcadeEditorType =
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require("@site/src/arcade/ArcadeEditor").ArcadeEditor;

              return (
                <ArcadeEditor
                  dispatch={dispatch}
                  ref={editorRef}
                  query={query}
                />
              );
            }}
          </BrowserOnly>
          <ArcadeQueryDisplay query={query.query} />
        </div>
        <div style={{ width: "50%" }}>
          {(() => {
            if (isExecutingQuery) return <ArcadeLoadingIndicator />;
            if (fetchParseError || errorPaths) return <div>Uh oh...</div>;
            if (parsedResponse)
              return <ArcadeSuccessView data={parsedResponse} />;
            return null;
          })()}
        </div>
      </Split>
    </div>
  );
}
