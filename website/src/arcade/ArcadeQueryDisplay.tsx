import * as React from "react";
import { HiClipboard } from "react-icons/hi";
import { copyToClipboard } from "@site/src/arcade/share";
import toast from "react-hot-toast";

type ArcadeQueryDisplayProps = {
  query?: string;
};

export function ArcadeQueryDisplay({ query }: ArcadeQueryDisplayProps) {
  const handleCopyQuery = () =>
    copyToClipboard(query, () => {
      toast.success("Copied query to clipboard.");
    });
  return (
    <div className="relative bg-gray-50 dark:bg-gray-800">
      <div className="px-4 pt-4 font-bold text-gray-700 dark:text-gray-200">
        Query
      </div>
      <div className="relative group">
        <pre className="p-4 bg-transparent rounded-none w-full overflow-auto text-gray-700 dark:text-gray-200 mb-0">
          {query || "..."}
        </pre>
        <div className="absolute right-0 inset-y-0 flex items-center pr-4">
          <button
            className="bg-gray-100 shadow w-8 h-8 rounded border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={handleCopyQuery}
          >
            <HiClipboard className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
