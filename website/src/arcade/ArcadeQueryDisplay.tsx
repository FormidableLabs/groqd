import * as React from "react";
import { HiClipboard } from "react-icons/hi";
import clsx from "clsx";

import { copyToClipboard } from "@site/src/arcade/share";
import toast from "react-hot-toast";
import { State } from "./state";

type ArcadeQueryDisplayProps = {
  query?: string;
  inputParseError: State["inputParseError"];
};

export function ArcadeQueryDisplay({
  query,
  inputParseError,
}: ArcadeQueryDisplayProps) {
  const handleCopyQuery = () =>
    copyToClipboard(query, () => {
      toast.success("Copied query to clipboard.");
    });
  return (
    <div className="relative bg-gray-50 dark:bg-zinc-800">
      <div className="px-4 pt-4 font-bold text-gray-700 dark:text-gray-200">
        Query
      </div>
      <div className="relative group">
        <pre
          className={clsx(
            "p-4 bg-transparent rounded-none w-full overflow-scroll pretty-scrollbar text-gray-700 dark:text-gray-200 mb-0",
            inputParseError && "text-red-700 dark:text-red-200"
          )}
        >
          {inputParseError ? inputParseError.toString() : query || "..."}
        </pre>
        <div className="absolute right-0 inset-y-0 flex items-center pr-4">
          <button
            className="bg-gray-100 dark:bg-zinc-700 shadow w-8 h-8 rounded border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={handleCopyQuery}
          >
            <HiClipboard className="text-xl dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
