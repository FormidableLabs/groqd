import * as React from "react";
import datasets from "@site/src/datasets.json";

type ArcadeDatasetSelectorProps = {
  selectDatasetPreset: (preset: keyof typeof datasets) => void;
};

export function ArcadeDatasetSelector({
  selectDatasetPreset,
}: ArcadeDatasetSelectorProps) {
  return (
    <div>
      <div>Dataset</div>
      <div>
        {Object.entries(datasets).map(([key, { title }]) => (
          <button
            key={key}
            onClick={() => selectDatasetPreset(key as keyof typeof datasets)}
          >
            {title}
          </button>
        ))}
      </div>
    </div>
  );
}
