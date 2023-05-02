import * as React from "react";
import { MODELS } from "@site/src/arcade/models";
import {
  defaultState,
  getStorageValue,
  reducer,
  setStorageValue,
} from "@site/src/arcade/state";
import { ArcadeHeader } from "@site/src/arcade/ArcadeHeader";
import { ArcadeQueryDisplay } from "@site/src/arcade/ArcadeQueryDisplay";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { ArcadeSuccessView } from "@site/src/arcade/ArcadeSuccessView";
import type { ArcadeEditorType } from "@site/src/arcade/ArcadeEditor";
import { ArcadeEditor } from "@site/src/arcade/ArcadeEditor";
import datasets from "@site/src/datasets.json";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import { ExamplePayload } from "@site/src/arcade/examples";
import { ArcadeSection } from "@site/src/arcade/ArcadeSection";
import { ArcadeDatasetEditor } from "@site/src/arcade/ArcadeDatasetEditor";

export function Arcade() {
  const editorRef = React.useRef<React.ElementRef<ArcadeEditorType>>();
  const [
    {
      query,
      params,
      isExecutingQuery,
      fetchParseError,
      parsedResponse,
      errorPaths,
    },
    dispatch,
  ] = React.useReducer(reducer, defaultState);

  // TODO: We need a "run" button somewhere
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _runQuery = () => {
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

  const loadExample = ({ code, dataset }: ExamplePayload) => {
    setDatasetPreset(dataset);
    MODELS.ts.setValue(code);

    const editor = editorRef.current;
    if (!editor) return;
    editorRef.current?.runCode({
      shouldRunQueryImmediately: true,
    });
  };

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
      <ArcadeHeader
        selectDatasetPreset={setDatasetPreset}
        selectExample={loadExample}
      >
        {/*<button onClick={runQuery} disabled={!query.query}>*/}
        {/*  Run query*/}
        {/*</button>*/}
        {/*<div className="w-12" />*/}
        {/*<ArcadeDatasetSelector selectDatasetPreset={setDatasetPreset} />*/}
        {/*<div className="w-12" />*/}
        {/*<ArcadeExampleSelector loadExample={loadExample} />*/}
      </ArcadeHeader>

      <div className="flex-1 flex items-center">
        <div className="w-full grid grid-cols-3 gap-5 max-h-[1200px] h-full container max-w-[2400px]">
          <ArcadeSection
            title="Dataset"
            subtitle="The data your query will run against."
          >
            <div className="h-full flex">
              <ArcadeDatasetEditor />
            </div>
          </ArcadeSection>
          <ArcadeSection
            title="Query Code"
            subtitle="Your code to run a GROQD query."
          >
            <div className="h-full flex flex-col">
              <ArcadeEditor dispatch={dispatch} ref={editorRef} />
              <ArcadeQueryDisplay query={query.query} />
            </div>
          </ArcadeSection>
          <ArcadeSection
            title="Query Result"
            subtitle="The result of your GROQD query."
          >
            <h1>Result view</h1>
            <div>
              {(() => {
                if (isExecutingQuery) return <ArcadeLoadingIndicator />;
                if (fetchParseError || errorPaths) return <div>Uh oh...</div>;
                if (parsedResponse)
                  return <ArcadeSuccessView data={parsedResponse} />;
                return null;
              })()}
            </div>
          </ArcadeSection>
        </div>
      </div>
    </div>
  );
}

const isDatasetPresetKey = (str: string): str is keyof typeof datasets =>
  str in datasets;
