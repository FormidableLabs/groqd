import { QueryConfig } from "./schema-types";
import type { LiteralUnion } from "type-fest";
import { StringKeys, ValueOf } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expressions {
  /**
   * This type allows any string, but provides
   * TypeScript suggestions for common expressions
   * (like '_type == "product"' or 'slug.current == $slug').
   */
  export type AnyConditional<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = LiteralUnion<
    // Let's suggest some equality expressions, like `slug.current == $slug`
    Equality<TResultItem, TQueryConfig>,
    string
  >;

  export type Equality<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = ValueOf<{
    [Key in SuggestedKeys<TResultItem>]: `${Key} == ${
      | LiteralValue<TResultItem[Key]>
      | VariablesOfType<TQueryConfig["variables"], TResultItem[Key]>}`;
  }>;
  type LiteralValue<TValue> = TValue extends string
    ? `"${TValue}"`
    : TValue extends number | boolean
    ? TValue
    : TValue extends null
    ? "null"
    : never;

  type SuggestedKeys<TResultItem> = StringKeys<keyof TResultItem>;

  export type VariablesOfType<TVariables, TType> = `$${AsString<
    KeysOfType<TVariables, TType>
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
