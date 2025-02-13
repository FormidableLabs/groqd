import { GroqBuilder } from "../../groq-builder";
import { Expressions } from "../../types/groq-expressions";
import { ResultItem } from "../../types/result-types";

declare module "../../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Allows you to write any raw filter expression.
     * This method is NOT type-checked, but does provide suggestions.
     *
     * This is an alias for the `filterRaw` method; please use that instead.
     *
     * @deprecated Please use `filterRaw` instead!
     *
     * @example
     * q.star.filterRaw("count(items[]) > 5")
     *
     * @param filterExpression - Any valid GROQ expression that can be used for filtering
     */
    filter(
      filterExpression: Expressions.AnyConditional<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >
    ): GroqBuilder<TResult, TQueryConfig>;

    /**
     * Allows you to write any raw filter expression.
     * This method is NOT type-checked, but does provide suggestions.
     *
     * @example
     * q.star.filterRaw("count(items[]) > 5")
     *
     * @param filterExpression - Any valid GROQ expression that can be used for filtering
     */
    filterRaw(
      filterExpression: Expressions.AnyConditional<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >
    ): GroqBuilder<TResult, TQueryConfig>;

    /**
     * Same as `filter`, but only supports simple, strongly-typed equality expressions.
     */
    filterBy(
      filterExpression: Expressions.Conditional<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >
    ): GroqBuilder<TResult, TQueryConfig>;
  }
}

GroqBuilder.implement({
  filter(this: GroqBuilder, filterExpression) {
    return this.filterRaw(filterExpression);
  },
  filterRaw(this: GroqBuilder, filterExpression) {
    const needsWrap = this.query.endsWith("->");
    const self = needsWrap ? this.extend({ query: `(${this.query})` }) : this;
    return self.pipe(`[${filterExpression}]`);
  },
  filterBy(this: GroqBuilder, filterExpression) {
    return this.filterRaw(filterExpression);
  },
});
