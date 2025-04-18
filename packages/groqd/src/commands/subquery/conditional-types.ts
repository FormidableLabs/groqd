import {
  ExtractProjectionResult,
  ProjectionMap,
} from "../../types/projection-types";
import {
  Empty,
  IntersectionOfValues,
  Simplify,
  ValueOf,
} from "../../types/utils";
import { QueryConfig } from "../../types/query-config";
import { GroqBuilderSubquery } from "../../groq-builder";
import { Expressions } from "../../types/groq-expressions";
import { ExtractDocumentTypes } from "../../types/document-types";
import { IGroqBuilder, InferResultType } from "../../groq-builder";

export type ConditionalProjectionMap<
  TResultItem,
  TQueryConfig extends QueryConfig
> = {
  [P in Expressions.AnyConditional<
    TResultItem,
    TQueryConfig
  >]?: ConditionalQuery<TResultItem, TQueryConfig>;
};

/**
 * The ConditionalQuery can be one of these values:
 * @example
 * q.conditional({
 *   // a Raw Projection:
 *   "condition1": { slug: "slug.current" },
 *   // a Query (for some edge-cases):
 *   "condition2": q.project({ slug: "slug.current" }),
 *   // a function that returns either a Raw Projection or a Query:
 *   "condition3": (q) => ({ slug: "slug.current" }),
 *   "condition4": (q) => q.project({ slug: "slug.current" }),
 * })
 *
 * @example
 * ...q.conditionalByType({
 *   link: { href: true },
 *   // The "callback" syntax allows `q` to be strongly-typed:
 *   button: q => ({ href: q.field("url") })
 *   reference: q => q.field("@").deref().project({ href: true }),
 * })
 */
export type ConditionalQuery<TResultItem, TQueryConfig extends QueryConfig> =
  // The ConditionalQuery can be o
  | ProjectionMap<TResultItem, TQueryConfig>
  | IGroqBuilder<object, TQueryConfig>
  | ((
      sub: GroqBuilderSubquery<TResultItem, TQueryConfig>
    ) =>
      | ProjectionMap<TResultItem, TQueryConfig>
      | IGroqBuilder<object, TQueryConfig>);

export type ExtractConditionalProjectionResults<
  TResultItem,
  TQueryConfig extends QueryConfig,
  TConditionalProjectionMap extends ConditionalProjectionMap<any, any>,
  TConfig extends ConditionalConfig
> = SpreadableConditionals<
  TConfig["key"],
  | (TConfig["isExhaustive"] extends true ? never : Empty)
  | ValueOf<{
      [P in keyof TConditionalProjectionMap]: ExtractConditionalQueryResult<
        TResultItem,
        TQueryConfig,
        NonNullable<TConditionalProjectionMap[P]>
      >;
    }>
>;

type ExtractConditionalQueryResult<
  TResultItem,
  TQueryConfig extends QueryConfig,
  TConditionalQueryResult extends ConditionalQuery<TResultItem, TQueryConfig>
> =
  // Return the type of the GroqBuilder:
  ReturnTypeMaybe<TConditionalQueryResult> extends IGroqBuilder<infer TResult>
    ? TResult
    : // Or the result of a raw projection:
      ExtractProjectionResult<
        TResultItem,
        TQueryConfig,
        ReturnTypeMaybe<TConditionalQueryResult>
      >;

type ReturnTypeMaybe<T> = T extends (...params: any) => infer TResult
  ? TResult
  : T;

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
  [_type in ExtractDocumentTypes<TResultItem>]?: ConditionalQuery<
    Extract<TResultItem, { _type: _type }>,
    TQueryConfig
  >;
};

export type ExtractConditionalByTypeProjectionResults<
  TResultItem,
  TQueryConfig extends QueryConfig,
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
      } & ExtractConditionalQueryResult<
        Extract<TResultItem, { _type: _type }>,
        TQueryConfig,
        NonNullable<TConditionalByTypeProjectionMap[_type]>
      >;
    }>
>;

export type ConditionalKey<TKey extends string> = `[CONDITIONAL] ${TKey}`;
export function isConditionalKey(key: string): key is ConditionalKey<string> {
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
