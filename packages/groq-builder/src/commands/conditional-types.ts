import {
  ExtractProjectionResult,
  ProjectionMap,
  ProjectionMapOrCallback,
} from "./projection-types";
import { Empty, IntersectionOfValues, Simplify, ValueOf } from "../types/utils";
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

/**
 * For now, none of our "conditions" are strongly-typed,
 * so we'll just use "string":
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ConditionalExpression<TResultItem> = string;

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
  /**
   * If using multiple conditions in a single projection,
   * each condition must have a unique key.
   * This key is not used in the resulting query, and can be anything.
   */
  key: TKey;
  /**
   * If the conditional statements cover all possible scenarios,
   * then setting `isExhaustive` to `true` will ensure stronger types,
   * and can throw runtime errors if none of the conditions are satisfied.
   */
  isExhaustive: TIsExhaustive;
};
