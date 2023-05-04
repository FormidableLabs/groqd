import * as React from "react";
import { ArcadeActionList } from "@site/src/arcade/ArcadeActionList";
import { ExamplePayload, EXAMPLES } from "@site/src/arcade/examples";
import clsx from "clsx";
import { HiShare } from "react-icons/hi";
import { copyShareUrl } from "@site/src/arcade/share";

type ArcadeHeaderProps = {
  selectExample(item: ExamplePayload): void;
};

export function ArcadeHeader({
  selectExample,
}: React.PropsWithChildren<ArcadeHeaderProps>) {
  return (
    <div className="py-5">
      <div className="container max-w-[2400px] flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <a
            className="inline-flex gap-3 items-center py-3 px-5 hover:bg-gray-50 rounded hover:no-underline transition-colors duration-150"
            href="/open-source/groqd"
          >
            <img src="/open-source/groqd/img/groqd-logo.png" width={40} />
            <span className="text-xl font-bold text-gray-700">GROQD</span>
          </a>

          <ArcadeActionList
            title="Example"
            items={ExampleItems}
            onSelectItem={selectExample}
          />
        </div>

        <button
          className={clsx(
            "inline-flex items-center border-none rounded-md px-4 py-2 cursor-pointer",
            "bg-transparent hover:bg-gray-50",
            "text-base font-bold text-gray-700"
          )}
          onClick={() => {
            copyShareUrl();
          }}
        >
          <span>Share</span>
          <HiShare className="ml-2" />
        </button>
      </div>
    </div>
  );
}

const ExampleItems = Object.entries(EXAMPLES).map(([title, value]) => ({
  title,
  value,
}));
