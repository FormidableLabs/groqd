import { GroqBuilder } from "../../groq-builder";
import { Parser } from "../../types/public-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * An "escape hatch" allowing you to write any groq query you want.
     * You must specify a type parameter for the new results.
     *
     * This should only be used for unsupported features, since it bypasses all strongly-typed inputs.
     */
    raw<TResultNew = never>(
      query: string,
      parser?: Parser<unknown, TResultNew> | null
    ): GroqBuilderChain<TResultNew, TQueryConfig>;
  }
}
GroqBuilder.implement({
  raw(this: GroqBuilder, query, parser) {
    // It's hard to tell if we should use `chain` or `pipe`.
    // If we supply a parser, then we'll use `.chain`,
    // to make sure there's no other existing parser.
    if (parser) {
      return this.chain(query, parser);
    }
    // Otherwise we'll just use the passive `.pipe`:
    return this.pipe(query);
    // TODO: consider if we should expose the raw `pipe` and `chain` options instead of this `raw`?
  },
});
