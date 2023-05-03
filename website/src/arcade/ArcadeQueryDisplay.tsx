import * as React from "react";

type ArcadeQueryDisplayProps = {
  query?: string;
};

export function ArcadeQueryDisplay({ query }: ArcadeQueryDisplayProps) {
  return (
    <div className="relative bg-gray-50">
      <div className="px-4 pt-4 font-bold text-gray-700">Query</div>
      <pre className="p-4 bg-transparent rounded-none w-full overflow-auto text-gray-700 mb-0">
        {query || "..."}
      </pre>
    </div>
  );
}
