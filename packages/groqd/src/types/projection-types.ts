import { GroqBuilderSubquery } from "../groq-builder";
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
import {
  FragmentInputTypeTag,
  IGroqBuilder,
  Parser,
  ParserWithWidenedInput,
} from "./public-types";
import { QueryConfig } from "./query-config";
import {
  ConditionalKey,
  ExtractConditionalProjectionTypes,
} from "../commands/subquery/conditional-types";
import { ProjectionPaths, ProjectionPathValue } from "./projection-paths";

export type ProjectionMap<TResultItem> = {
  [P in LiteralUnion<keyof TResultItem, string>]?: ProjectionFieldConfig<
    TResultItem,
    P extends keyof TResultItem ? UndefinedToNull<TResultItem[P]> : any
  >;
} & {
  // Obviously this allows the ellipsis operator:
  "..."?: true | Parser;
};

export type ProjectionMapOrCallback<
  TResultItem,
  TQueryConfig extends QueryConfig
> =
  | ProjectionMap<TResultItem>
  | ((
      sub: GroqBuilderSubquery<TResultItem, TQueryConfig>
    ) => ProjectionMap<TResultItem>);

export type ProjectionFieldConfig<TResultItem, TFieldType> =
  // Use 'true' to include a field as-is
  | true
  // Use a string for naked projections, like 'slug.current'
  | ProjectionPaths<TResultItem>
  // Use a parser to include a field, passing it through the parser at run-time
  | ParserWithWidenedInput<TFieldType>
  // Use a tuple for naked projections with a parser
  | readonly [ProjectionPaths<TResultItem>, ParserWithWidenedInput<TFieldType>]
  // Use a GroqBuilder instance to create a nested projection
  | IGroqBuilder;

export type ExtractProjectionResult<TResultItem, TProjectionMap> = Override<
  // Extract the "..." operator:
  (TProjectionMap extends { "...": true } ? TResultItem : Empty) &
    (TProjectionMap extends { "...": Parser<TResultItem, infer TOutput> }
      ? TOutput
      : Empty),
  // Extract any conditional expressions:
  ExtractConditionalProjectionTypes<TProjectionMap> &
    // Extract all the fields:
    ExtractProjectionResultFields<
      TResultItem,
      // Be sure to omit the Conditionals, "...", and fragment metadata:
      Omit<
        TProjectionMap,
        "..." | typeof FragmentInputTypeTag | ConditionalKey<string>
      >
    >
>;

type ExtractProjectionResultFields<TResultItem, TProjectionMap> = {
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
    ? TProjectionMap[P] extends ProjectionPaths<TResultItem>
      ? ProjectionPathValue<TResultItem, TProjectionMap[P]>
      : TypeMismatchError<{
          error: `⛔️ Naked projections can only be used for known properties; '${TProjectionMap[P]}' is not known ⛔️`;
          actual: TProjectionMap[P];
          expected: SimplifyDeep<ProjectionPaths<TResultItem>>;
        }>
    : /* Extract type from a [ProjectionKey, Parser] tuple, like ['slug.current', z.string() ] */
    TProjectionMap[P] extends readonly [infer TKey, infer TParser]
    ? TKey extends ProjectionPaths<TResultItem>
      ? TParser extends Parser<infer TParserInput, infer TParserOutput>
        ? ValidateParserInput<
            ProjectionPathValue<TResultItem, TKey>,
            TParserInput,
            TParserOutput,
            TKey
          >
        : TypeMismatchError<{
            error: `⛔️ Naked projections can only be used for known properties; '${TKey}' is not known ⛔️`;
            actual: TKey;
            expected: SimplifyDeep<ProjectionPaths<TResultItem>>;
          }>
      : TypeMismatchError<{
          error: `⛔️ Naked projections can only be used for known properties; '${ExtractString<TKey>}' is not known ⛔️`;
          actual: TKey;
          expected: SimplifyDeep<ProjectionPaths<TResultItem>>;
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
