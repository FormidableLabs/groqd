import { QueryConfig } from "./query-config";
import type { IsLiteral, LiteralUnion } from "type-fest";
import { StringKeys, UndefinedToNull, ValueOf } from "./utils";
import { Path, PathKeysWithType, PathValue } from "./path-types";

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
   * A strongly-typed conditional Groq conditional expression.
   * Currently, this only supports simple "equality" expressions,
   * like '_type == "product"' or 'slug.current == $slug'.
   * */
  export type Conditional<TResultItem, TQueryConfig extends QueryConfig> =
    // Currently we only support simple expressions:
    Equality<TResultItem, TQueryConfig> | Booleans<TResultItem>;

  type Comparison<
    TResultItem,
    TQueryConfig extends QueryConfig,
    _Comparison extends string = "==",
    /** (local use only) Calculate our Parameter entries once, and reuse across suggestions */
    _ParameterEntries = ParameterEntries<TQueryConfig["parameters"]>
  > = ValueOf<{
    [Key in SuggestedKeys<TResultItem>]: `${Key} ${_Comparison} ${SuggestedValues<
      _ParameterEntries,
      SuggestedKeysValue<TResultItem, Key>
    >}`;
  }>;

  export type Equality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Comparison<TResultItem, TQueryConfig, "==">;

  export type Inequality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Comparison<TResultItem, TQueryConfig, "!=">;

  type Booleans<TResultItem> = ValueOf<{
    [Key in PathKeysWithType<TResultItem, boolean>]: Key | `!${Key}`;
  }>;

  // Escape literal values:
  type LiteralValue<TValue> = TValue extends string
    ? `"${TValue}"`
    : TValue extends number | boolean | null
    ? TValue
    : never;

  // Make some literal suggestions:
  type LiteralSuggestion<TValue> = IsLiteral<TValue> extends true
    ? // If we're already dealing with a literal value, we don't need suggestions:
      never
    : TValue extends string
    ? "(string)"
    : TValue extends number
    ? "(number)"
    : never;

  // Suggest keys:
  type SuggestedKeys<TResultItem> = Path<TResultItem>;
  type SuggestedKeysValue<
    TResultItem,
    TKey extends SuggestedKeys<TResultItem>
  > = UndefinedToNull<PathValue<TResultItem, TKey>>;

  type SuggestedValues<TParameterEntries, TValue> =
    // First, suggest parameters:
    | StringKeysWithType<TParameterEntries, TValue>
    // Next, make some literal suggestions:
    | LiteralSuggestion<TValue>
    // Finally, allow all literal values:
    | LiteralValue<TValue>;

  export type ParameterEntries<TParameters> = {
    [P in Path<TParameters> as `$${P}`]: PathValue<TParameters, P>;
  };

  /**
   * Finds all (string) keys of TObject where the value matches the given TType
   */
  export type StringKeysWithType<TObject, TType> = StringKeys<
    ValueOf<{
      [P in keyof TObject]: TObject[P] extends TType
        ? P
        : TType extends TObject[P]
        ? P
        : never;
    }>
  >;
}
