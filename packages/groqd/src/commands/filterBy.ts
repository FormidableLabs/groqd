import { GroqBuilder } from "../groq-builder";
import { Expressions } from "../types/groq-expressions";
import { ConfigCreateNestedScope } from "../types/query-config";
import { ResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * This is an alias for the `filterRaw` method; please use that instead.
     *
     * Filters based on any raw filter expression.
     * This method is NOT type-checked, but does provide suggestions.
     *
     * @deprecated Please use `filterRaw` instead!
     *
     * @example
     * q.star.filterRaw("count(items[]) > 5")
     *
     * @param filterExpression - Any valid GROQ expression that can be used for filtering
     */
    filter(
      ...filterExpression: NonEmptyArray<
        Expressions.AnyConditional<ResultItem.Infer<TResult>, TQueryConfig>
      >
    ): GroqBuilder<TResult, TQueryConfig>;

    /**
     * Filters based on any raw filter expression(s).
     * This method is NOT type-checked, but does provide suggestions.
     *
     * Multiple expressions will be combined with "OR" logic.
     *
     * @example
     * q.star.filterRaw("count(items[]) > 5")
     *
     * @param filterExpression - Any valid GROQ expression that can be used for filtering
     */
    filterRaw(
      ...filterExpression: NonEmptyArray<
        Expressions.AnyConditional<
          ResultItem.Infer<TResult>,
          ConfigCreateNestedScope<TQueryConfig, ResultItem.Infer<TResult>>
        >
      >
    ): GroqBuilder<TResult, TQueryConfig>;

    /**
     * Filters the results based on a simple,
     * strongly-typed equality expression.
     *
     * Multiple calls will result in "AND" logic.
     * Multiple arguments will be combined with "OR" logic.
     *
     * This method is strongly-typed, but only supports common expressions.
     * If you'd like to filter based off more complex logic, use `filterRaw` instead.
     *
     * @example
     * q.star.filterByType("product")
     *  .filterBy("image.url != null")
     *  .filterBy('category == "food"')
     *  .filterBy("price < 50", "msrp < 50")
     *  .filterBy("references(^._id)")
     */
    filterBy(
      ...filterExpression: NonEmptyArray<
        Expressions.Conditional<
          ResultItem.Infer<TResult>,
          ConfigCreateNestedScope<TQueryConfig, ResultItem.Infer<TResult>>
        >
      >
    ): GroqBuilder<TResult, TQueryConfig>;
  }
}

type NonEmptyArray<T> = [T, ...T[]];

GroqBuilder.implement({
  filter(this: GroqBuilder, ...filterExpressions) {
    return this.filterRaw(...filterExpressions);
  },
  filterRaw(this: GroqBuilder, ...filterExpressions) {
    const needsWrap = this.query.endsWith("->");
    const self = needsWrap ? this.extend({ query: `(${this.query})` }) : this;
    return self.chain(`[${filterExpressions.join(" || ")}]`, "passthrough");
  },
  filterBy(this: GroqBuilder, ...filterExpressions) {
    return this.filterRaw(...filterExpressions);
  },
});
