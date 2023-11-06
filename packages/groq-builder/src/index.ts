import { RootConfig } from "./utils/schema-types";
import { GroqBuilder, GroqBuilderOptions } from "./groq-builder";
import "./commands";

type RootScope = never;

export function createGroqBuilder<TRootConfig extends RootConfig>(
  options: GroqBuilderOptions = { indent: "" }
) {
  return new GroqBuilder<RootScope, TRootConfig>({
    query: "",
    parser: null,
    options,
  });
}

export { GroqBuilder };
