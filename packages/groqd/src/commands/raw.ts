import { GroqBuilderBase } from "../groq-builder";
import { Parser } from "../types/public-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderBase<TResult, TQueryConfig> {
    /**
     * An "escape hatch" allowing you to write any groq query you want.
     * You must specify a type parameter for the new results.
     *
     * This should only be used for unsupported features, since it bypasses all strongly-typed inputs.
     */
    raw<TResultNew = never>(
      query: string,
      parser?: Parser<unknown, TResultNew> | null | "passthrough"
    ): GroqBuilder<TResultNew, TQueryConfig>;
  }
}
const rawImplementation: Pick<GroqBuilderBase, "raw"> = {
  raw(this: GroqBuilderBase, query, parser) {
    return this.chain(query, parser);
  },
};
GroqBuilderBase.implement(rawImplementation);
