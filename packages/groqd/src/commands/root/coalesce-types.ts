// eslint-disable-next-line @typescript-eslint/no-namespace
import { ProjectionPathEntries } from "../../types/projection-paths";
import { IGroqBuilder } from "../../types/public-types";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CoalesceExpressions {
  export type CoalesceArgs<TResult> = ArrayMin2<CoalesceArg<TResult>>;

  type ArrayMin2<T> = [T, T, ...Array<T>];

  type CoalesceArg<TResult> =
    | keyof ProjectionPathEntries<TResult>
    | IGroqBuilder;

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
