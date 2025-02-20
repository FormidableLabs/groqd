import { GroqBuilder } from "../groq-builder";
import { IGroqBuilderNotChainable } from "../types/public-types";
import { IsNullable } from "../types/utils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Asserts that the results are NOT nullable.
     * Useful when you know there must be a value,
     * even though the query thinks it might be null.
     *
     * ⚠️ NOTE: This method can only be used at the end of a query chain,
     * because you cannot chain more commands after making an assertion.
     * See CHAINED_ASSERTION_ERROR for more details.
     *
     * @example
     * q.star
     *  .filter("slug.current == $slug")
     *  .slice(0) // <- this return type is nullable, even though we expect there will be a match
     *  .project({ name: zod.string() })
     *  .notNull() // <- this ensures that the results are not null
     *
     * @example
     * q.star.filterByType("product").project(sub => ({
     *   categories: sub.field("categories[]") // <- nullable array
     *                  .deref()
     *                  .field("name", zod.string())
     *                  .notNull()
     * }));
     *
     * @param redundant - If the type is already not-nullable, then you must explicitly pass `.notNull(true)` to allow this redundancy. (This has no impact at runtime)
     */
    notNull(
      ...redundant: IsNullable<TResult> extends true ? [] : [true]
    ): IGroqBuilderNotChainable<NonNullable<TResult>, TQueryConfig>;
  }
}

GroqBuilder.implement({
  notNull(this: GroqBuilder, ..._redundant) {
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
