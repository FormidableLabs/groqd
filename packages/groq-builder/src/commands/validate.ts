import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    validate<TResultNew>(
      parser:
        | ParserObject<TResult, TResultNew>
        | ParserFunction<TResult, TResultNew>
    ): GroqBuilder<TResultNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  validate(this: GroqBuilder, parser) {
    return this.chain("", parser);
  },
});
