import * as React from "react";
import { MODELS } from "@site/src/arcade/models";
import {
  defaultState,
  getStorageValue,
  isDatasetPresetKey,
  reducer,
  setStorageValue,
} from "@site/src/arcade/state";
import { ArcadeHeader } from "@site/src/arcade/ArcadeHeader";
import { ArcadeQueryDisplay } from "@site/src/arcade/ArcadeQueryDisplay";
import { ArcadeEditor } from "@site/src/arcade/ArcadeEditor";
import datasets from "@site/src/datasets.json";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import { ExamplePayload, EXAMPLES } from "@site/src/arcade/examples";
import { ArcadeSection } from "@site/src/arcade/ArcadeSection";
import { ArcadeDatasetEditor } from "@site/src/arcade/ArcadeDatasetEditor";
import { ArcadeResponseView } from "@site/src/arcade/ArcadeResponseView";
import lzstring from "lz-string";
import { runCodeEmitter } from "@site/src/arcade/eventEmitters";
import { DefaultToastOptions, Toaster } from "react-hot-toast";
import { HiPlay } from "react-icons/hi";
import clsx from "clsx";
import { ArcadeActionList } from "@site/src/arcade/ArcadeActionList";

export function Arcade() {
  const [
    {
      query,
      isExecutingQuery,
      fetchParseError,
      parsedResponse,
      errorPaths,
      rawResponse,
    },
    dispatch,
  ] = React.useReducer(reducer, defaultState);

  const setDatasetPreset = React.useCallback(
    (datasetPreset: keyof typeof datasets) => {
      MODELS.json.setValue(datasets[datasetPreset].data);
      setStorageValue(ARCADE_STORAGE_KEYS.DATASET, datasetPreset);
    },
    []
  );

  const loadExample = ({ code, dataset }: ExamplePayload) => {
    setDatasetPreset(dataset);
    MODELS.ts.setValue(code);

    runCodeEmitter.emit(true);
  };

  const handleRun = () => {
    runCodeEmitter.emit(true);
  };

  /**
   * On mount, if we're missing dataset/code – load in basic example.
   */
  React.useEffect(() => {
    if (
      !getStorageValue(ARCADE_STORAGE_KEYS.DATASET) &&
      !getStorageValue(ARCADE_STORAGE_KEYS.CODE)
    ) {
      loadExample(EXAMPLES["Basic Query"]);
    }
  }, []);

  /**
   * Load in dataset
   */
  React.useEffect(() => {
    const storedDataset = getStorageValue(ARCADE_STORAGE_KEYS.DATASET);

    if (!storedDataset) return;

    if (isDatasetPresetKey(storedDataset))
      setTimeout(() => {
        setDatasetPreset(storedDataset);
      });
    else {
      try {
        const d = lzstring.decompressFromEncodedURIComponent(storedDataset);
        if (d) {
          MODELS.json.setValue(d);
        }
      } catch {}
    }
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <ArcadeHeader selectExample={loadExample} />

      <div className="flex-1 flex items-center">
        <div className="w-full grid grid-cols-3 gap-5 max-h-[1200px] h-full container max-w-[2400px] pb-5">
          <ArcadeSection
            title="Dataset"
            subtitle="The data your query will run against."
            headerRightContent={
              <ArcadeActionList
                title="Dataset"
                items={DatasetItems}
                onSelectItem={setDatasetPreset}
              />
            }
          >
            <div className="h-full relative">
              <ArcadeDatasetEditor />
            </div>
          </ArcadeSection>
          <ArcadeSection
            title="Query Code"
            subtitle="Your code to run a GROQD query."
            headerRightContent={
              <button
                className={clsx(
                  "group border-none rounded-md flex items-center gap-3 px-4 py-1",
                  "text-base font-bold cursor-pointer text-gray-700",
                  "bg-gray-50 hover:bg-gray-200 transition-colors duration-150"
                )}
                onClick={handleRun}
              >
                <span>Run</span>
                <HiPlay className="text-3xl opacity-90 group-hover:opacity-100 text-green-600 transition-colors transition-opacity duration-150" />
              </button>
            }
          >
            <div className="h-full flex flex-col">
              <div className="relative flex-1">
                <ArcadeEditor dispatch={dispatch} />
              </div>
              <ArcadeQueryDisplay query={query.query} />
            </div>
          </ArcadeSection>
          <ArcadeSection
            title="Query Result"
            subtitle="The result of your GROQD query."
          >
            <ArcadeResponseView
              isExecutingQuery={isExecutingQuery}
              fetchParseError={fetchParseError}
              errorPaths={errorPaths}
              parsedResponse={parsedResponse}
              rawResponse={rawResponse}
            />
          </ArcadeSection>
        </div>
      </div>

      <Toaster toastOptions={toastOptions} />
    </div>
  );
}

const DatasetItems = Object.entries(datasets).map(([key, { title }]) => ({
  title,
  value: key,
}));

const toastOptions = {
  className: "rounded-md bg-white shadow-md",
  position: "top-right",
  error: {
    className: "bg-red-100",
    icon: null,
  },
  success: {
    className: "bg-green-50",
    icon: null,
  },
} satisfies DefaultToastOptions;
