import { Expressions } from "./groq-expressions";
import {
  Empty,
  ExtractString,
  IsAny,
  LiteralUnion,
  Override,
  SimplifyDeep,
  StringKeys,
  UndefinedToNull,
} from "./utils";
import { TypeMismatchError } from "./type-mismatch-error";
import { Parser, ParserWithWidenedInput } from "./parser-types";
import { QueryConfig } from "./query-config";
import {
  ConditionalKey,
  ExtractConditionalProjectionTypes,
} from "../commands/subquery/conditional-types";
import { IGroqBuilder } from "../groq-builder";
import { FragmentMetadataKeys } from "./fragment-types";

export type ProjectionMap<TResultItem, TQueryConfig extends QueryConfig> = {
  [P in LiteralUnion<keyof TResultItem, string>]?: ProjectionFieldConfig<
    TResultItem,
    TQueryConfig,
    P extends keyof TResultItem ? UndefinedToNull<TResultItem[P]> : any
  >;
} & {
  // Obviously this allows the ellipsis operator:
  "..."?: true | Parser;
};

export type ProjectionFieldConfig<
  TResultItem,
  TQueryConfig extends QueryConfig,
  TFieldType
> =
  // Use 'true' to include a field as-is
  | true
  // Use a string for naked projections, like '_type', 'slug.current', or '^._id'
  | Expressions.Field<TResultItem, TQueryConfig>
  // Use a parser to include a field, passing it through the parser at run-time
  | ParserWithWidenedInput<TFieldType>
  // Use a tuple for naked projections with a parser
  | readonly [
      Expressions.Field<TResultItem, TQueryConfig>,
      ParserWithWidenedInput<TFieldType>
    ]
  // Use a GroqBuilder instance to create a nested projection
  | IGroqBuilder;

export type ExtractProjectionResult<
  TResultItem,
  TQueryConfig extends QueryConfig,
  TProjectionMap
> = Override<
  // Extract the "..." operator:
  ExtractSpreadOperator<TResultItem, TProjectionMap>,
  // Extract any conditional expressions:
  ExtractConditionalProjectionTypes<TProjectionMap> &
    // Extract all the fields:
    ExtractProjectionResultFields<
      TResultItem,
      TQueryConfig,
      // Be sure to omit the spread operator, fragment metadata, and Conditionals:
      Omit<
        TProjectionMap,
        "..." | FragmentMetadataKeys | ConditionalKey<string>
      >
    >
>;

type ExtractSpreadOperator<TResultItem, TProjectionMap> =
  TProjectionMap extends { "...": true }
    ? TResultItem
    : TProjectionMap extends { "...": Parser<TResultItem, infer TOutput> }
    ? TOutput
    : Empty;

type ExtractProjectionResultFields<
  TResultItem,
  TQueryConfig extends QueryConfig,
  TProjectionMap
> = {
  [P in keyof TProjectionMap]: TProjectionMap[P] extends IGroqBuilder<
    infer TValue
  > // Extract the type from GroqBuilder:
    ? TValue
    : /* Extract the type from a 'true' value: */
    TProjectionMap[P] extends boolean
    ? P extends keyof TResultItem
      ? UndefinedToNull<TResultItem[P]>
      : TypeMismatchError<{
          error: `⛔️ 'true' can only be used for known properties; '${StringKeys<P>}' is not known ⛔️`;
          actual: P;
          expected: keyof TResultItem;
        }>
    : /* Extract type from a ProjectionKey string, like 'slug.current': */
    TProjectionMap[P] extends string
    ? TProjectionMap[P] extends Expressions.Field<TResultItem, TQueryConfig>
      ? Expressions.FieldValue<TResultItem, TQueryConfig, TProjectionMap[P]>
      : TypeMismatchError<{
          error: `⛔️ Naked projections can only be used for known properties; '${TProjectionMap[P]}' is not known ⛔️`;
          actual: TProjectionMap[P];
          expected: SimplifyDeep<Expressions.Field<TResultItem, TQueryConfig>>;
        }>
    : /* Extract type from a [ProjectionKey, Parser] tuple, like ['slug.current', z.string() ] */
    TProjectionMap[P] extends readonly [infer TKey, infer TParser]
    ? TKey extends Expressions.Field<TResultItem, TQueryConfig> & string
      ? TParser extends Parser<infer TParserInput, infer TParserOutput>
        ? ValidateParserInput<
            Expressions.FieldValue<TResultItem, TQueryConfig, TKey>,
            TParserInput,
            TParserOutput,
            TKey
          >
        : TypeMismatchError<{
            error: `⛔️ Naked projections can only be used for known properties; '${TKey}' is not known ⛔️`;
            actual: TKey;
            expected: SimplifyDeep<
              Expressions.Field<TResultItem, TQueryConfig>
            >;
          }>
      : TypeMismatchError<{
          error: `⛔️ Naked projections can only be used for known properties; '${ExtractString<TKey>}' is not known ⛔️`;
          actual: TKey;
          expected: SimplifyDeep<Expressions.Field<TResultItem, TQueryConfig>>;
        }>
    : /* Extract type from Parser: */
    TProjectionMap[P] extends Parser<infer TParserInput, infer TParserOutput>
    ? P extends keyof TResultItem
      ? ValidateParserInput<
          UndefinedToNull<TResultItem[P]>,
          TParserInput,
          TParserOutput,
          StringKeys<P>
        >
      : TypeMismatchError<{
          error: `⛔️ A parser can only be used for known properties; '${StringKeys<P>}' is not known ⛔️`;
          actual: P;
          expected: keyof TResultItem;
        }>
    : never;
};

export type ValidateParserInput<
  TIncomingValue,
  TParserInput,
  TParserOutput,
  TKey extends string
> =
  // We need to ensure that the Parser accepts a WIDER input than the value:
  TIncomingValue extends TParserInput
    ? TParserOutput
    : // When using <any> for the schema, it's fine:
    IsAny<TIncomingValue> extends true
    ? TParserOutput
    : TypeMismatchError<{
        error: `⛔️ The '${TKey}' field has a data type that is not fully compatible with the specified parser ⛔️`;
        actual: TIncomingValue;
        expected: TParserInput;
      }>;
