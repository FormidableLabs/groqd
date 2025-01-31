import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";
import { ResultUtils } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Marks a query as nullable – in case you are expecting a potential `null` value.
     *
     * @param redundant - If the type is already nullable, then you must explicitly pass `.nullable(true)` to allow this redundancy. (This has no impact at runtime)
     */
    nullable(
      ...redundant: ResultUtils.IsNullable<TResult> extends true ? [true] : []
    ): GroqBuilder<TResult | null, TQueryConfig>;
  }
}

GroqBuilder.implement({
  nullable(this: GroqBuilder<any, QueryConfig>, _redundant) {
    const parser = this.parser;

    if (!parser) {
      // If there's no previous parser, then this method is just used
      // for type-safety, and we don't need to perform runtime validation:
      return this;
    }
    return this.extend({
      parser: (input) => {
        return input === null || input === undefined ? null : parser(input);
      },
    });
  },
});
