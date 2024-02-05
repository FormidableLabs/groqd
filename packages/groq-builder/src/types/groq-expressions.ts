import { QueryConfig } from "./schema-types";
import type { IsLiteral, LiteralUnion } from "type-fest";
import { UndefinedToNull, ValueOf } from "./utils";
import { Path, PathValue } from "./path-types";

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
    // Currently we only support equality expressions:
    Equality<TResultItem, TQueryConfig>;

  export type Equality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = ValueOf<{
    [Key in SuggestedKeys<TResultItem>]: `${Key} == ${
      // First, suggest parameters:
      | ParametersOfType<
            TQueryConfig["parameters"],
            SuggestedKeysValue<TResultItem, Key>
          >
        // Next, make some literal suggestions:
        | LiteralSuggestion<SuggestedKeysValue<TResultItem, Key>>
        // Finally, allow all literal values:
        | LiteralValue<SuggestedKeysValue<TResultItem, Key>>
    }`;
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

  export type ParametersOfType<TParameters, TType> = `$${AsString<
    KeysOfType<TParameters, TType>
  >}`;
  type KeysOfType<TObject, TType> = ValueOf<{
    [P in keyof TObject]: TObject[P] extends TType
      ? P
      : TType extends TObject[P]
      ? P
      : never;
  }>;
  type AsString<T> = Extract<T, string>;
}
