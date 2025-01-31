import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";
import { ResultUtils } from "../types/result-types";
import { Override } from "../types/utils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Marks a query as nullable – in case you are expecting a potential `null` value.
     *
     * @param redundant - If the type is already not-nullable, then you must explicitly pass `.notNull(true)` to allow this redundancy. (This has no impact at runtime)
     */
    notNull(
      ...redundant: ResultUtils.IsNullable<TResult> extends true ? [] : [true]
    ): GroqBuilder<
      ResultUtils.Wrap<
        Override<ResultUtils.Unwrap<TResult>, { IsNullable: false }>
      >,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  notNull(this: GroqBuilder<any, QueryConfig>, ..._redundant) {
    const parser = this.parser;
    return this.extend({
      parser: (input) => {
        if (input === null) {
          throw new TypeError("Expected a non-null value");
        }
        return parser ? parser(input) : input;
      },
    });
  },
});
