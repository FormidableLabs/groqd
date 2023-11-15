import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../types/public-types";
import { RootConfig } from "../types/schema-types";

import { getParserFunction } from "./parseUtils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    parse<TResultNew>(
      parser:
        | ParserObject<TResult, TResultNew>
        | ParserFunction<TResult, TResultNew>
    ): GroqBuilder<TResultNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  parse(this: GroqBuilder, parser) {
    return this.chain("", getParserFunction(parser));
  },
});
