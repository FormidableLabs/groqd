import { ProjectionPathEntries } from "../../types/projection-paths";

import { IGroqBuilder } from "../../groq-builder";

export namespace CoalesceExpressions {
  /**
   * Represents the array of args that can be
   * passed to the `coalesce` method
   */
  export type CoalesceArgs<TResult> = ArrayMin2<CoalesceArg<TResult>>;

  type ArrayMin2<T> = [T, T, ...Array<T>];

  type CoalesceArg<TResult> =
    | keyof ProjectionPathEntries<TResult>
    | IGroqBuilder;

  /**
   * Extracts the result type from the `coalesce` method
   */
  export type CoalesceResult<
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
}
