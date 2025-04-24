import {
  GroqBuilder,
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { IsNullable } from "../../types/utils";
import { QueryConfig } from "../../types/query-config";
import { Expressions } from "../../types/groq-expressions";
import { IGroqBuilder, isGroqBuilder } from "../../groq-builder";

declare module "../../groq-builder" {
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends CountDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends CountDefinition<TResult, TQueryConfig> {}
}

interface CountDefinition<TResult, TQueryConfig extends QueryConfig> {
  /**
   * Wraps the expressions with GROQ's `count(...)` function.
   *
   * The `expression` can be either a projection string, or any valid query.
   *
   * @example
   * q.star.filterByType("product").project(product => ({
   *   // Use a simple projection string:
   *   imageCount: product.count("images[]"),
   *   // Use any complex query:
   *   categoryCount: product.count(
   *     product.star.filterByType("category").filterRaw("references(^._id)")
   *   ),
   * }));
   */
  count<TExpressionResult extends Array<any> | null>(
    expression: IGroqBuilder<TExpressionResult>
  ): GroqBuilder<
    | number
    // Considering `count(null)` would return `null`:
    | (IsNullable<TExpressionResult> extends true ? null : never),
    TQueryConfig
  >;
  /**
   * Wraps the expressions with GROQ's `count(...)` function.
   *
   * The `expression` can be either a projection string, or any valid query.
   *
   * @example
   * q.star.filterByType("product").project(product => ({
   *   // Use a simple projection string:
   *   imageCount: product.count("images[]"),
   *   // Use any complex query:
   *   categoryCount: product.count(
   *     product.star.filterByType("category").filterRaw("references(^._id)")
   *   ),
   * }));
   */
  count<TExpression extends keyof Expressions.CountableEntries<TResult>>(
    expression: TExpression
  ): GroqBuilder<
    | number
    // Considering `count(null)` would return `null`:
    | (IsNullable<
        Expressions.CountableEntries<TResult>[TExpression]
      > extends true
        ? null
        : never),
    TQueryConfig
  >;
}
const countImplementation: CountDefinition<any, any> = {
  count(this: GroqBuilderBase, expression: IGroqBuilder | string) {
    const query: string = isGroqBuilder(expression)
      ? expression.query
      : expression;
    return this.chain(`count(${query})`);
  },
};
GroqBuilderRoot.implement(countImplementation);
GroqBuilderSubquery.implement(countImplementation);
