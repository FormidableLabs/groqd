import { GroqBuilder } from "../groq-builder";
import { Parser } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    validate<TResultNew>(
      parser: Parser<TResult, TResultNew>
    ): GroqBuilder<TResultNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  validate(this: GroqBuilder, parser) {
    return this.chain("", parser);
  },
});
