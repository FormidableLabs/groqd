import {
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { QueryConfig } from "../../types/query-config";
import { IGroqBuilder, isGroqBuilder } from "../../types/public-types";
import { ProjectionPathEntries } from "../../types/projection-paths";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends CoalesceDefinition<TResult, TQueryConfig> {}

  interface CoalesceDefinition<TResult, TQueryConfig extends QueryConfig> {
    coalesce<TExpressions extends CoalesceArgs<TResult>>(
      ...expressions: TExpressions
    ): GroqBuilder<CoalesceResult<TResult, TExpressions>, TQueryConfig>;
  }
}

type ArrayMin2<T> = [T, T, ...Array<T>];
type CoalesceArgs<TResult> = ArrayMin2<CoalesceArg<TResult>>;
type CoalesceArg<TResult> = keyof ProjectionPathEntries<TResult> | IGroqBuilder;

type CoalesceResult<
  TResult,
  TExpressions extends CoalesceArgs<TResult>
> = CoalesceValues<TResult, TExpressions> extends [
  ...Array<infer TNullableValues>,
  infer TFinalValue
]
  ? NonNullable<TNullableValues> | TFinalValue
  : never;

type CoalesceValues<
  TResult,
  TExpressions extends CoalesceArgs<TResult>,
  _PathEntries = ProjectionPathEntries<TResult>
> = {
  [Index in keyof TExpressions]: CoalesceExpressionValue<
    _PathEntries,
    TExpressions[Index]
  >;
};

type CoalesceExpressionValue<PathEntries, TExpression> =
  TExpression extends IGroqBuilder<infer ExpressionResult>
    ? ExpressionResult
    : TExpression extends keyof PathEntries
    ? PathEntries[TExpression]
    : never; // (unreachable)

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
    return this.chain(`coalesce(${queries.join(", ")})`);
  },
};
GroqBuilderRoot.implement(coalesceImplementation);
GroqBuilderSubquery.implement(coalesceImplementation);
