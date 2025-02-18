import {
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { IsNullable } from "../../types/utils";
import { QueryConfig } from "../../types/query-config";
import { IGroqBuilder, isGroqBuilder } from "../../types/public-types";
import { Expressions } from "../../types/groq-expressions";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends CountDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends CountDefinition<TResult, TQueryConfig> {}

  interface CountDefinition<TResult, TQueryConfig extends QueryConfig> {
    count<TExpressionResult extends Array<any> | null>(
      expression: IGroqBuilder<TExpressionResult>
    ): GroqBuilder<
      | number
      // Considering `count(null)` would return `null`:
      | (IsNullable<TExpressionResult> extends true ? null : never),
      TQueryConfig
    >;
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
}

const countImplementation: Pick<
  GroqBuilderRoot & GroqBuilderSubquery,
  "count"
> = {
  count(this: GroqBuilderBase, expression: IGroqBuilder | string) {
    const query: string = isGroqBuilder(expression)
      ? expression.query
      : expression;
    return this.chain(`count(${query})`);
  },
};
GroqBuilderRoot.implement(countImplementation);
GroqBuilderSubquery.implement(countImplementation);
