import { GroqBuilder } from "../groq-builder";
import { Expressions } from "../types/groq-expressions";
import { ResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    filter(
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
    const needsWrap = this.query.endsWith("->");
    const self = needsWrap ? this.wrap("(", ")") : this;
    return self.chain(`[${filterExpression}]`);
  },
  filterBy(this: GroqBuilder, filterExpression) {
    return this.filter(filterExpression);
  },
});
