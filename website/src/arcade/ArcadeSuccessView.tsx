import * as React from "react";

type ArcadeSuccessViewProps = {
  data: unknown;
};

export function ArcadeSuccessView({ data }: ArcadeSuccessViewProps) {
  return (
    <div>
      <h1>Great success</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
