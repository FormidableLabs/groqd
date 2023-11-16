import type { RootConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions } from "./groq-builder";

import "./commands";

// Export all our public types:
export * from "./types/public-types";
export * from "./types/schema-types";
export { GroqBuilder } from "./groq-builder";

type RootResult = never;

export function createGroqBuilder<TRootConfig extends RootConfig>(
  options: GroqBuilderOptions = { indent: "" }
) {
  return new GroqBuilder<RootResult, TRootConfig>({
    query: "",
    parser: null,
    options,
  });
}
