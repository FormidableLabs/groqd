import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";
import { ResultUtils } from "../types/result-types";
import { IGroqBuilderNotChainable } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Marks a query as nullable – in case you are expecting a potential `null` value.
     * Useful when you expect missing values in your data,
     * even though the query thinks it's required.
     *
     * ⚠️ NOTE: This method can only be used at the end of a query chain,
     * because you cannot chain more commands after making an assertion.
     * See CHAINED_ASSERTION_ERROR for more details.
     *
     * @param redundant - If the type is already nullable, then you must explicitly pass `.nullable(true)` to allow this redundancy. (this has no impact at runtime)
     */
    nullable(
      ...redundant: ResultUtils.IsNullable<TResult> extends true ? [true] : []
    ): IGroqBuilderNotChainable<TResult | null, TQueryConfig>;
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
