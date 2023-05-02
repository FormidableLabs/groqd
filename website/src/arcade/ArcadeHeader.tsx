import * as React from "react";
import {
  ArcadeDatasetSelector,
  ArcadeDatasetSelectorProps,
} from "@site/src/arcade/ArcadeDatasetSelector";

export function ArcadeHeader({
  selectDatasetPreset,
}: React.PropsWithChildren<ArcadeDatasetSelectorProps & {}>) {
  return (
    <div className="py-5">
      <div className="container max-w-[2400px] flex items-center gap-5">
        <a
          className="inline-flex gap-3 items-center py-3 px-5 hover:bg-gray-50 rounded hover:no-underline transition-colors duration-150"
          href="/open-source/groqd"
        >
          <img src="img/groqd-logo.png" width={60} />
          <span className="text-2xl font-bold text-gray-700">GROQD</span>
        </a>

        <ArcadeDatasetSelector selectDatasetPreset={selectDatasetPreset} />
      </div>
    </div>
  );
}
