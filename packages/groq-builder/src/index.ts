import { RootConfig } from "./utils/schema-types";
import { GroqBuilder, GroqBuilderOptions } from "./groq-builder";
import "./commands";

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

export { GroqBuilder };
