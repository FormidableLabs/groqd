import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Marks a query as nullable – in case you are expecting a potential `null` value.
     */
    nullable(): GroqBuilder<TResult | null, TQueryConfig>;
  }
}

GroqBuilder.implement({
  nullable(this: GroqBuilder<any, QueryConfig>) {
    const parser = this.parser;

    if (!parser) {
      // If there's no previous parser, then this method is just used
      // for type-safety, and we don't need to perform runtime validation:
      return this;
    }
    return this.chain("", (input) => {
      return input === null ? null : parser(input);
    });
  },
});
