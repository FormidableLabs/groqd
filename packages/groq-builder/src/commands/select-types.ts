import { ExtractTypeNames, RootConfig } from "../types/schema-types";
import { StringKeys, ValueOf } from "../types/utils";
import { ConditionalExpression } from "./conditional-types";
import { GroqBuilder } from "../groq-builder";
import { InferResultType } from "../types/public-types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SelectProjections<TResultItem, TRootConfig extends RootConfig> = {
  [Condition: ConditionalExpression<TResultItem>]: GroqBuilder;
};

export type ExtractSelectResult<
  TSelectProjections extends SelectProjections<any, any>
> = ValueOf<{
  [P in StringKeys<keyof TSelectProjections>]: InferResultType<
    TSelectProjections[P]
  >;
}>;

export type SelectByTypeProjections<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [_type in ExtractTypeNames<TResultItem>]?: (
    q: GroqBuilder<Extract<TResultItem, { _type: _type }>, TRootConfig>
  ) => GroqBuilder;
};

export type ExtractSelectByTypeResult<
  TSelectProjections extends SelectByTypeProjections<any, any>
> = ValueOf<{
  [_type in keyof TSelectProjections]: InferResultType<
    ReturnType<NonNullable<TSelectProjections[_type]>>
  >;
}>;
