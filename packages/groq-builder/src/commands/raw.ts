import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    /**
     * Adds a raw string to the query
     */
    raw<TResultNew = unknown>(
      groq: string
    ): GroqBuilder<TResultNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  raw<TResultNew = unknown>(this: GroqBuilder, groq: string) {
    return this.chain<TResultNew>(groq);
  },
});
