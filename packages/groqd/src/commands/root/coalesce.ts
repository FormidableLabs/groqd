import {
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { QueryConfig } from "../../types/query-config";
import { notNull } from "../../types/utils";
import { InvalidQueryError } from "../../types/invalid-query-error";
import { unionParser } from "../../validation/simple-validation";
import { CoalesceExpressions } from "./coalesce-types";
import { IGroqBuilder, isGroqBuilder } from "../../groq-builder";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}

  interface CoalesceDefinition<TResult, TQueryConfig extends QueryConfig> {
    /**
     * Wraps the expressions with GROQ's `coalesce(...)` function.
     *
     * Each `expression` can be either a projection string, or any valid query.
     *
     * @example
     * q.star.filterByType("product").project(product => ({
     *   title: product.coalesce(
     *     "title",
     *     "category.title",
     *     product.field("variant").slice(0).deref().field("title"),
     *     q.value("DEFAULT")
     *   ),
     * }));
     */
    coalesce<TExpressions extends CoalesceExpressions.CoalesceArgs<TResult>>(
      ...expressions: TExpressions
    ): GroqBuilder<
      CoalesceExpressions.CoalesceResult<TResult, TExpressions>,
      TQueryConfig
    >;
  }
}

const coalesceImplementation: Pick<
  GroqBuilderRoot & GroqBuilderSubquery,
  "coalesce"
> = {
  coalesce(
    this: GroqBuilderBase,
    ...expressions: Array<IGroqBuilder | string>
  ) {
    const queries = expressions.map((expression) =>
      isGroqBuilder(expression) ? expression.query : expression
    );

    // Ensure an all-or-nothing approach with the parsers:
    const maybeParsers = expressions.map((expression) =>
      isGroqBuilder(expression) ? expression.parser : null
    );
    const parsers = maybeParsers.filter(notNull);
    const hasSomeParsers =
      parsers.length && parsers.length < expressions.length;
    if (hasSomeParsers) {
      const missing = maybeParsers
        .map((p, i) => (p ? null : queries[i]))
        .filter(notNull);
      throw new InvalidQueryError(
        "COALESCE_MISSING_VALIDATION",
        `With 'coalesce', you must supply validation for either all, or none, of the expressions.` +
          ` You did not supply validation for "${missing.join('" or "')}"`
      );
    }
    const parser = !parsers.length ? null : unionParser(parsers);

    return this.chain(`coalesce(${queries.join(", ")})`, parser);
  },
};
GroqBuilderRoot.implement(coalesceImplementation);
GroqBuilderSubquery.implement(coalesceImplementation);
