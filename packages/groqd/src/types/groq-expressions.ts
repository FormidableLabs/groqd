import { ConfigGetScope, QueryConfig } from "./query-config";
import type { ConditionalPick, IsLiteral, LiteralUnion } from "type-fest";
import { StringKeys, ValueOf, Variable } from "./utils";
import {
  ProjectionPathEntries,
  ProjectionPathEntriesByType,
  ProjectionPaths,
  ProjectionPathsByType,
  ProjectionPathValue,
} from "./projection-paths";

export namespace Expressions {
  /**
   * Represents valid expressions for selecting a value.
   * This includes:
   *   - fields of the current item (e.g. `"_type"`)
   *   - parameters (e.g. `"$id"`)
   *   - parent selectors (e.g. `"^._id"`)
   *   - self (e.g. `"@"`)
   */
  export type Field<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = ProjectionPaths<TResultItem & ConfigGetScope<TQueryConfig>>;

  /**
   * Retrieves the value of the
   */
  export type FieldValue<
    TResultItem,
    TQueryConfig extends QueryConfig,
    TFieldPath extends Field<TResultItem, TQueryConfig>
  > = ProjectionPathValue<
    TResultItem & ConfigGetScope<TQueryConfig>,
    TFieldPath
  >;

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
  export type Conditional<
    TResultItem,
    TQueryConfig extends QueryConfig
  > = Variable<ProjectionPathEntries<TResultItem>> extends infer $PathEntries
    ? // Currently we only support these simple expressions:
      | Equality<$PathEntries, TQueryConfig>
        | Inequality<$PathEntries, TQueryConfig>
        | BooleanSuggestions<$PathEntries>
        | References<TQueryConfig>
    : never;

  type Comparison<
    TPathEntries,
    TQueryConfig extends QueryConfig,
    ComparisonOperator extends string
  > = ValueOf<{
    [Key in StringKeys<
      keyof TPathEntries
    >]: `${Key} ${ComparisonOperator} ${SuggestedKeysByType<
      TQueryConfig,
      TPathEntries[Key]
    >}`;
  }>;

  type Equality<TPathEntries, TQueryConfig extends QueryConfig> = Comparison<
    TPathEntries,
    TQueryConfig,
    "=="
  >;

  type Inequality<TPathEntries, TQueryConfig extends QueryConfig> = Comparison<
    ConditionalPick<TPathEntries, string | number | boolean | null>,
    TQueryConfig,
    "!="
  >;

  type MatchExpression<
    TPathEntries,
    TQueryConfig extends QueryConfig
  > = Comparison<ConditionalPick<TPathEntries, string>, TQueryConfig, "match">;

  type References<TQueryConfig extends QueryConfig> = `references(${IgnorePaths<
    ProjectionPathsByType<ConfigGetScope<TQueryConfig>, string | string[]>,
    // Ignore common string types that aren't ids:
    "_type" | "_createdAt" | "_updatedAt" | "_rev" | "_key"
  >})`;

  type IgnorePaths<Paths extends string, Key extends string> = Exclude<
    Paths,
    Key | `${string}.${Key}`
  >;

  export type NumberComparisons<
    TPathEntries,
    TQueryConfig extends QueryConfig
  > = Comparison<
    ConditionalPick<TPathEntries, number>,
    TQueryConfig,
    ">" | ">=" | "<" | "<="
  >;

  type BooleanSuggestions<TPathEntries> = ValueOf<{
    [Key in StringKeys<keyof ConditionalPick<TPathEntries, boolean>>]:
      | Key
      | `!${Key}`;
  }>;

  /**
   * Suggest literal values:
   */
  type LiteralValue<TValue> = TValue extends string
    ? `"${TValue}"`
    : TValue extends number | null
    ? TValue
    : TValue extends undefined
    ? null
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

  type SuggestedKeysByType<TQueryConfig extends QueryConfig, TValue> =
    // First, suggest scope items (eg. parameters, parent selectors):
    | ProjectionPathsByType<ConfigGetScope<TQueryConfig>, TValue>
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

  /**
   * Returns suggestions for ordering the results.
   *
   * @example
   * Order<Product> ==
   * | "name" | "name asc" | "name desc"
   * | "price" | "price asc" | "price desc"
   * | "slug.current" | "slug.current asc" | "slug.current desc"
   */
  export type Order<TResultItem> = `${ProjectionPathsByType<
    TResultItem,
    SortableTypes
  >}${"" | " asc" | " desc"}`;

  type SortableTypes = string | number | boolean | null;

  export type CountableEntries<TResult> = PickByKey<
    ProjectionPathEntriesByType<TResult, Array<any>>,
    `${string}[]` // We only want "actual" arrays, not nested ones
  >;
  type PickByKey<T, Key> = {
    [P in Extract<keyof T, Key>]: T[P];
  };
}
