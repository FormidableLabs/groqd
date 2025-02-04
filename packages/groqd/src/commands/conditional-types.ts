import {
  ExtractProjectionResult,
  ProjectionMap,
  ProjectionMapOrCallback,
} from "./projection-types";
import { Empty, IntersectionOfValues, Simplify, ValueOf } from "../types/utils";
import { QueryConfig } from "../types/query-config";
import { GroqBuilder } from "../groq-builder";
import { IGroqBuilder, InferResultType } from "../types/public-types";
import { Expressions } from "../types/groq-expressions";
import { ExtractDocumentTypes } from "../types/document-types";

export type ConditionalProjectionMap<
  TResultItem,
  TQueryConfig extends QueryConfig
> = Partial<
  Record<
    Expressions.AnyConditional<TResultItem, TQueryConfig>,
    | ProjectionMap<TResultItem>
    | ((
        q: GroqBuilder<TResultItem, TQueryConfig>
      ) => ProjectionMap<TResultItem>)
  >
>;

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
  TQueryConfig extends QueryConfig
> = {
  [_type in ExtractDocumentTypes<TResultItem>]?: ProjectionMapOrCallback<
    Extract<TResultItem, { _type: _type }>,
    TQueryConfig
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
  | (TConfig["isExhaustive"] extends true
      ? never
      : {
          /**
           * When using conditionalByType,
           * this _type is automatically added to the query.
           */
          _type: Exclude<
            ExtractDocumentTypes<TResultItem>,
            keyof TConditionalByTypeProjectionMap
          >;
        })
  | ValueOf<{
      [_type in keyof TConditionalByTypeProjectionMap]: {
        /**
         * When using conditionalByType,
         * this _type is automatically added to the query.
         */
        _type: _type;
      } & ExtractProjectionResult<
        Extract<TResultItem, { _type: _type }>,
        TConditionalByTypeProjectionMap[_type] extends (
          q: any
        ) => infer TProjectionMap
          ? TProjectionMap
          : TConditionalByTypeProjectionMap[_type]
      >;
    }>
>;

export type ConditionalKey<TKey extends string> = `[CONDITIONAL] ${TKey}`;
export function isConditional(key: string): key is ConditionalKey<string> {
  return key.startsWith("[CONDITIONAL] ");
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
   * and will throw runtime errors if none of the conditions are satisfied.
   */
  isExhaustive: TIsExhaustive;
};
