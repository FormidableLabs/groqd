import {
  ExtractProjectionResult,
  ProjectionMap,
  ProjectionMapOrCallback,
} from "./projection-types";
import {
  Empty,
  IntersectionOfValues,
  Simplify,
  Tagged,
  ValueOf,
} from "../types/utils";
import { ExtractTypeNames, RootConfig } from "../types/schema-types";
import { GroqBuilder } from "../groq-builder";
import { IGroqBuilder, InferResultType } from "../types/public-types";

export type ConditionalProjectionMap<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [Condition: ConditionalExpression<TResultItem>]:
    | ProjectionMap<TResultItem>
    | ((
        q: GroqBuilder<TResultItem, TRootConfig>
      ) => ProjectionMap<TResultItem>);
};

export type ConditionalExpression<TResultItem> = Tagged<string, TResultItem>;

export type ExtractConditionalProjectionResults<
  TResultItem,
  TConditionalProjectionMap extends ConditionalProjectionMap<any, any>,
  TConfig extends ConditionalConfig
> = SpreadableConditionals<
  TConfig["key"],
  | (TConfig["isExhaustive"] extends true ? never : Empty)
  | ValueOf<{
      [P in keyof TConditionalProjectionMap]: ExtractProjectionResult<
        TResultItem,
        TConditionalProjectionMap[P]
      >;
    }>
>;

export type OmitConditionalProjections<TResultItem> = {
  [P in Exclude<keyof TResultItem, ConditionalKey<string>>]: TResultItem[P];
};

export type ExtractConditionalProjectionTypes<TProjectionMap> = Simplify<
  IntersectionOfValues<{
    [P in Extract<
      keyof TProjectionMap,
      ConditionalKey<string>
    >]: InferResultType<Extract<TProjectionMap[P], IGroqBuilder>>;
  }>
>;

export type ConditionalByTypeProjectionMap<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [_type in ExtractTypeNames<TResultItem>]?: ProjectionMapOrCallback<
    Extract<TResultItem, { _type: _type }>,
    TRootConfig
  >;
};

export type ExtractConditionalByTypeProjectionResults<
  TResultItem,
  TConditionalByTypeProjectionMap extends ConditionalByTypeProjectionMap<
    any,
    any
  >,
  TConfig extends ConditionalConfig
> = SpreadableConditionals<
  TConfig["key"],
  | (TConfig["isExhaustive"] extends true ? never : Empty)
  | ValueOf<{
      [_type in keyof TConditionalByTypeProjectionMap]: ExtractProjectionResult<
        Extract<TResultItem, { _type: _type }>,
        TConditionalByTypeProjectionMap[_type] extends (
          q: any
        ) => infer TProjectionMap
          ? TProjectionMap
          : TConditionalByTypeProjectionMap[_type]
      >;
    }>
>;

export type ConditionalKey<TKey extends string> = `[Conditional] ${TKey}`;
export function isConditional(key: string): key is ConditionalKey<string> {
  return key.startsWith("[Conditional] ");
}
export type SpreadableConditionals<
  TKey extends string,
  ConditionalResultType
> = {
  [UniqueConditionalKey in ConditionalKey<TKey>]: IGroqBuilder<ConditionalResultType>;
};

export type ConditionalConfig<
  TKey extends string = string,
  TIsExhaustive extends boolean = boolean
> = {
  key: TKey;
  isExhaustive: TIsExhaustive;
};
