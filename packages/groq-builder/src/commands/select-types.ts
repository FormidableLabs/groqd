import { ExtractTypeNames, QueryConfig } from "../types/schema-types";
import { StringKeys, ValueOf } from "../types/utils";
import { GroqBuilder, IGroqBuilder } from "../groq-builder";
import { InferResultType } from "../types/public-types";
import { Expressions } from "../types/groq-expressions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SelectProjections<
  TResultItem,
  TQueryConfig extends QueryConfig
> = Partial<
  Record<Expressions.AnyConditional<TResultItem, TQueryConfig>, IGroqBuilder>
>;

export type ExtractSelectResult<
  TSelectProjections extends SelectProjections<any, any>
> = ValueOf<{
  [P in StringKeys<keyof TSelectProjections>]: InferResultType<
    NonNullable<TSelectProjections[P]>
  >;
}>;

export type SelectByTypeProjections<
  TResultItem,
  TQueryConfig extends QueryConfig
> = {
  [_type in ExtractTypeNames<TResultItem>]?:
    | IGroqBuilder
    | ((
        q: GroqBuilder<Extract<TResultItem, { _type: _type }>, TQueryConfig>
      ) => IGroqBuilder);
};

export type ExtractSelectByTypeResult<
  TSelectProjections extends SelectByTypeProjections<any, any>
> = ValueOf<{
  [_type in keyof TSelectProjections]: TSelectProjections[_type] extends IGroqBuilder<
    infer TResult
  >
    ? TResult
    : TSelectProjections[_type] extends (q: any) => IGroqBuilder<infer TResult>
    ? TResult
    : never;
}>;
