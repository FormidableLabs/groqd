import { RootConfig } from "./utils/schema-types";
import { GroqBuilder } from "./groq-builder";
import "./commands";

type RootScope = never;

export function createGroqBuilder<TRootConfig extends RootConfig>() {
  return new GroqBuilder<RootScope, TRootConfig>("", null, null);
}

export { GroqBuilder };