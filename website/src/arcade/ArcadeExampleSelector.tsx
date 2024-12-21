import * as React from "react";
import { ExamplePayload, EXAMPLES } from "@site/src/arcade/examples";

type ArcadeExampleSelectorProps = {
  loadExample(example: ExamplePayload): void;
};

export function ArcadeExampleSelector({
  loadExample,
}: ArcadeExampleSelectorProps) {
  return (
    <div>
      <div>Load an Example</div>
      <div>
        {Object.entries(EXAMPLES).map(([title, value]) => (
          <button key={title} onClick={() => loadExample(value)}>
            {title}
          </button>
        ))}
      </div>
    </div>
  );
}
