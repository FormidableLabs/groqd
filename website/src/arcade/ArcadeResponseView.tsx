import * as React from "react";
import { State } from "@site/src/arcade/state";
import { ArcadeLoadingIndicator } from "@site/src/arcade/ArcadeLoadingIndicator";
import { JSONExplorer } from "@site/src/arcade/JSONExplorer";

type ArcadeResponseViewProps = Pick<
  State,
  "isExecutingQuery" | "fetchParseError" | "errorPaths" | "parsedResponse"
> & {};

export function ArcadeResponseView({
  isExecutingQuery,
  fetchParseError,
  errorPaths,
  parsedResponse,
}: ArcadeResponseViewProps) {
  if (isExecutingQuery) return <ArcadeLoadingIndicator />;

  if (fetchParseError || errorPaths?.size) {
    return <div>ERROR!</div>;
  }

  if (parsedResponse) return <JSONExplorer data={parsedResponse} />;

  return <div>idle...</div>;
}
