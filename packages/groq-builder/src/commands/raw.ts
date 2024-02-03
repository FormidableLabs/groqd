import { GroqBuilder } from "../groq-builder";
import { Parser } from "../types/public-types";

declare module "../groq-builder" {
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
      parser?: Parser | null
    ): GroqBuilder<TResultNew, TQueryConfig>;
  }
}
GroqBuilder.implement({
  raw(this: GroqBuilder, query, parser) {
    return this.chain(query, parser);
  },
});
