import * as React from "react";
import { MODELS } from "@site/src/arcade/models";
import {
  defaultState,
  getStorageValue,
  reducer,
  setStorageValue,
} from "@site/src/arcade/state";
import { ArcadeHeader } from "@site/src/arcade/ArcadeHeader";
import Split from "@uiw/react-split";
import { ArcadeEditorTabs } from "@site/src/arcade/ArcadeEditorTabs";
import { ArcadeQueryDisplay } from "@site/src/arcade/ArcadeQueryDisplay";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { ArcadeSuccessView } from "@site/src/arcade/ArcadeSuccessView";
import type { ArcadeEditorType } from "@site/src/arcade/ArcadeEditor";
import { ArcadeEditor } from "@site/src/arcade/ArcadeEditor";
import { ArcadeDatasetSelector } from "@site/src/arcade/ArcadeDatasetSelector";
import datasets from "@site/src/datasets.json";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";

export function Arcade() {
  const editorRef = React.useRef<React.ElementRef<ArcadeEditorType>>();
  const [
    {
      activeModel,
      query,
      params,
      isExecutingQuery,
      fetchParseError,
      parsedResponse,
      errorPaths,
    },
    dispatch,
  ] = React.useReducer(reducer, defaultState);

  const setModel = (newModel: keyof typeof MODELS) => {
    const editor = editorRef.current;
    if (!editor) return;

    dispatch({ type: "SET_ACTIVE_MODEL", payload: newModel });
    editor.setModel(newModel);
  };

  const runQuery = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.runQuery({ query, params, dispatch });
  };

  const setDatasetPreset = React.useCallback(
    (datasetPreset: keyof typeof datasets) => {
      const editor = editorRef.current;
      if (!editor) return;

      MODELS.json.setValue(
        JSON.stringify(datasets[datasetPreset].data, null, 2)
      );
      setStorageValue(ARCADE_STORAGE_KEYS.DATASET, datasetPreset);
    },
    []
  );

  React.useEffect(() => {
    const storedDataset =
      getStorageValue(ARCADE_STORAGE_KEYS.DATASET) || "pokemon";

    if (isDatasetPresetKey(storedDataset))
      setTimeout(() => {
        setDatasetPreset(storedDataset);
      });
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <ArcadeHeader>
        <button onClick={runQuery} disabled={!query.query}>
          Run query
        </button>
        <div className="w-12" />
        <ArcadeDatasetSelector selectDatasetPreset={setDatasetPreset} />
      </ArcadeHeader>
      <Split className="flex-1">
        <div style={{ width: "50%" }} className="flex flex-col">
          <ArcadeEditorTabs activeModel={activeModel} switchModel={setModel} />
          <ArcadeEditor dispatch={dispatch} ref={editorRef} />
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

const isDatasetPresetKey = (str: string): str is keyof typeof datasets =>
  str in datasets;
