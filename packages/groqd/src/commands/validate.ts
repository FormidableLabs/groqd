import { GroqBuilderChain } from "../groq-builder";
import { Parser } from "../types/public-types";
import { chainParsers, normalizeValidationFunction } from "./validate-utils";

declare module "../groq-builder" {
  export interface GroqBuilderChain<TResult, TQueryConfig> {
    /**
     * Adds runtime validation to the query results.
     */
    validate<TResultNew>(
      parser: Parser<TResult, TResultNew>
    ): GroqBuilderChain<TResultNew, TQueryConfig>;

    /**
     * Adds runtime transformation to the query results.
     *
     * (alias for `validate`, for better semantics)
     */
    transform<TResultNew>(
      parser: Parser<TResult, TResultNew>
    ): GroqBuilderChain<TResultNew, TQueryConfig>;
  }
}

GroqBuilderChain.implement({
  validate(this: GroqBuilderChain, parser): GroqBuilderChain {
    const chainedParser = chainParsers(
      this.internal.parser,
      normalizeValidationFunction(parser)
    );
    return this.extend({
      parser: chainedParser,
    });
  },
  transform(this: GroqBuilderChain, parser) {
    return this.validate(parser);
  },
});
