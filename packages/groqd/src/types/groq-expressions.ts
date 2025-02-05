import { QueryConfig } from "./query-config";
import type { ConditionalPick, IsLiteral, LiteralUnion } from "type-fest";
import { StringKeys, ValueOf } from "./utils";
import { PathKeysWithType, PathEntries } from "./path-types";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expressions {
  /**
   * This type allows any string, but provides
   * TypeScript suggestions for common expressions,
   * like '_type == "product"' or 'slug.current == $slug'.
   */
  export type AnyConditional<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = LiteralUnion<
    // Suggest some equality expressions, like `slug.current == $slug`,
    Conditional<TResultItem, TQueryConfig>,
    // but still allow for any string:
    string
  >;

  /**
   * This type allows any string, but provides
   * TypeScript suggestions for common expressions,
   * like '_type == "product"' or 'slug.current == $slug'
   * and 'title match (string)' for the score command
   */
  export type Score<TResultItem, TQueryConfig extends QueryConfig> =
    // Suggest some equality expressions, like `slug.current == $slug`,
    | Conditional<TResultItem, TQueryConfig>
    // and `title match (string)`
    | MatchExpression<TResultItem, TQueryConfig>;

  /**
   * Same as Score, but allows any valid string
   */
  export type ScoreRaw<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = LiteralUnion<Score<TResultItem, TQueryConfig>, string>;

  /**
   * A strongly-typed conditional Groq conditional expression.
   * Currently, this only supports simple "equality" expressions,
   * like '_type == "product"' or 'slug.current == $slug'.
   * */
  export type Conditional<TResultItem, TQueryConfig extends QueryConfig> =
    // Currently we only support simple expressions:
    Equality<TResultItem, TQueryConfig> | BooleanSuggestions<TResultItem>;

  type Comparison<
    TPathEntries,
    TQueryConfig extends QueryConfig,
    _Comparison extends string = "=="
  > = ValueOf<{
    [Key in StringKeys<
      keyof TPathEntries
    >]: `${Key} ${_Comparison} ${SuggestedKeysByType<
      TQueryConfig["scope"],
      TPathEntries[Key]
    >}`;
  }>;

  export type Equality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Comparison<PathEntries<TResultItem>, TQueryConfig, "==">;

  export type Inequality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Comparison<PathEntries<TResultItem>, TQueryConfig, "!=">;

  export type MatchExpression<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Comparison<
    ConditionalPick<PathEntries<TResultItem>, string>,
    TQueryConfig,
    "match"
  >;

  type BooleanSuggestions<TResultItem> = ValueOf<{
    [Key in PathKeysWithType<TResultItem, boolean>]: Key | `!${Key}`;
  }>;

  /**
   * Suggest literal values:
   */
  type LiteralValue<TValue> = TValue extends string
    ? `"${TValue}"`
    : TValue extends number | boolean | null
    ? TValue
    : never;

  /**
   * Make some literal suggestions,
   * like (string) or (number)
   */
  type LiteralSuggestion<TValue> = IsLiteral<TValue> extends true
    ? // If we're already dealing with a literal value, we don't need suggestions:
      never
    : TValue extends string
    ? "(string)"
    : TValue extends number
    ? "(number)"
    : never;

  type SuggestedKeysByType<TScope, TValue> =
    // First, suggest parameters:
    | KeysByType<PathEntries<TScope>, TValue>
    // Next, make some literal suggestions:
    | LiteralSuggestion<TValue>
    // Suggest all literal values:
    | LiteralValue<TValue>;

  /**
   * Finds all (string) keys of TObject where the value matches the given TType
   */
  export type KeysByType<TObject, TType> = StringKeys<
    ValueOf<{
      [P in keyof TObject]: TObject[P] extends TType
        ? P
        : TType extends TObject[P]
        ? P
        : never;
    }>
  >;
}
