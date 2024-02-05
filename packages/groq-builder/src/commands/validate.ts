import { GroqBuilder } from "../groq-builder";
import { Parser } from "../types/public-types";
import { chainParsers, normalizeValidationFunction } from "./validate-utils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Adds runtime validation to the query results.
     */
    validate<TResultNew>(
      parser: Parser<TResult, TResultNew>
    ): GroqBuilder<TResultNew, TRootConfig>;

    /**
     * Adds runtime transformation to the query results.
     *
     * (alias for `validate`, for better semantics)
     */
    transform<TResultNew>(
      parser: Parser<TResult, TResultNew>
    ): GroqBuilder<TResultNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  validate(this: GroqBuilder, parser) {
    const chainedParser = chainParsers(
      this.internal.parser,
      normalizeValidationFunction(parser)
    );
    return this.chain("", chainedParser);
  },
  transform(this: GroqBuilder, parser) {
    return this.validate(parser);
  },
});
