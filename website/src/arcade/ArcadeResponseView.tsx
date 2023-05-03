import * as React from "react";
import { State } from "@site/src/arcade/state";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { JSONExplorer } from "@site/src/arcade/JSONExplorer";
import { formatErrorPath } from "../../../shared/util/formatErrorPath";

type ArcadeResponseViewProps = Pick<
  State,
  | "isExecutingQuery"
  | "fetchParseError"
  | "errorPaths"
  | "parsedResponse"
  | "rawResponse"
>;

export function ArcadeResponseView({
  isExecutingQuery,
  fetchParseError,
  errorPaths,
  parsedResponse,
  rawResponse,
}: ArcadeResponseViewProps) {
  if (isExecutingQuery) return <ArcadeLoadingIndicator />;

  if (errorPaths?.size) {
    const scrollToErr = (path: string) => {
      const lineEl = document.getElementById(`json-item-${path}`);
      if (lineEl instanceof HTMLElement)
        lineEl.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="max-h-[200px] overflow-hidden border-b border-transparent border-b-gray-100 border-solid flex flex-col">
          <div className="px-4 py-2 font-bold text-sm text-red-700">
            Error parsing:
          </div>
          <div className="px-4 flex-1 overflow-auto">
            {[...errorPaths.entries()].map(([path, message]) => (
              <div
                key={path}
                className="cursor-pointer hover:bg-gray-50 p-1 text-sm"
                onClick={() => scrollToErr(path)}
              >
                <span className="text-gray-700 font-mono">
                  result{formatErrorPath(path)}
                </span>
                : {message}
              </div>
            ))}
            <div className="h-2" />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 font-bold text-sm text-gray-700">
            Raw Response
          </div>
          <div className="flex-1 relative">
            <JSONExplorer data={rawResponse} highlightedPaths={errorPaths} />
          </div>
        </div>
      </div>
    );
  }

  // TODO: Make this not terrible
  if (fetchParseError instanceof Error) {
    return <pre>{fetchParseError.message}</pre>;
  }

  // TODO: Make this not terrible
  if (fetchParseError) {
    return <div>Something went wrong...</div>;
  }

  if (parsedResponse) return <JSONExplorer data={parsedResponse} />;

  // TODO: Make this not terrible
  return <div>idle...</div>;
}
