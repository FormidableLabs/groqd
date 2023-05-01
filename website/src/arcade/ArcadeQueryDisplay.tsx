import * as React from "react";

type ArcadeQueryDisplayProps = {
  query?: string;
};

export function ArcadeQueryDisplay({ query }: ArcadeQueryDisplayProps) {
  return (
    <div className="p-3 bg-red-100">
      <pre>{query || "..."}</pre>
    </div>
  );
}
