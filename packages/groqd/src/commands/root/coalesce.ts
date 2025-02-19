import {
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { QueryConfig } from "../../types/query-config";
import { IGroqBuilder, isGroqBuilder } from "../../types/public-types";
import { notNull } from "../../types/utils";
import { InvalidQueryError } from "../../types/invalid-query-error";
import { unionParser } from "../../validation/simple-validation";
import { CoalesceExpressions } from "./coalesce-types";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}

  interface CoalesceDefinition<TResult, TQueryConfig extends QueryConfig> {
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
