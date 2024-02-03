import { GroqBuilder } from "../groq-builder";
import {
  Empty,
  IsAny,
  LiteralUnion,
  Simplify,
  SimplifyDeep,
  StringKeys,
  TypeMismatchError,
  UndefinedToNull,
  ValueOf,
} from "../types/utils";
import {
  FragmentInputTypeTag,
  IGroqBuilder,
  Parser,
  ParserWithWidenedInput,
} from "../types/public-types";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";
import { RootConfig } from "../types/schema-types";
import {
  ConditionalKey,
  ExtractConditionalProjectionTypes,
} from "./conditional-types";

export type ProjectionKey<TResultItem> = IsAny<TResultItem> extends true
  ? string
  : ProjectionKeyImpl<Simplify<PathEntries<DeepRequired<TResultItem>>>>;
type ProjectionKeyImpl<Entries> = ValueOf<{
  [Key in keyof Entries]: Entries[Key] extends Array<any>
    ? `${StringKeys<Key>}[]` | Key
    : Key;
}>;

export type ProjectionKeyValue<TResultItem, TKey> = UndefinedToNull<
  PathValue<
    TResultItem,
    Extract<TKey extends `${infer TPath}[]` ? TPath : TKey, Path<TResultItem>>
  >
>;

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
  TRootConfig extends RootConfig
> =
  | ProjectionMap<TResultItem>
  | ((q: GroqBuilder<TResultItem, TRootConfig>) => ProjectionMap<TResultItem>);

export type ProjectionFieldConfig<TResultItem, TFieldType> =
  // Use 'true' to include a field as-is
  | true
  // Use a string for naked projections, like 'slug.current'
  | ProjectionKey<TResultItem>
  // Use a parser to include a field, passing it through the parser at run-time
  | ParserWithWidenedInput<TFieldType>
  // Use a tuple for naked projections with a parser
  | readonly [ProjectionKey<TResultItem>, ParserWithWidenedInput<TFieldType>]
  // Use a GroqBuilder instance to create a nested projection
  | IGroqBuilder;

export type ExtractProjectionResult<TResultItem, TProjectionMap> =
  // Extract the "..." operator:
  (TProjectionMap extends { "...": true } ? TResultItem : Empty) &
    (TProjectionMap extends { "...": Parser<TResultItem, infer TOutput> }
      ? TOutput
      : Empty) &
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
          error: `⛔️ 'true' can only be used for known properties ⛔️`;
          expected: keyof TResultItem;
          actual: P;
        }>
    : /* Extract type from a ProjectionKey string, like 'slug.current': */
    TProjectionMap[P] extends string
    ? TProjectionMap[P] extends ProjectionKey<TResultItem>
      ? ProjectionKeyValue<TResultItem, TProjectionMap[P]>
      : TypeMismatchError<{
          error: `⛔️ Naked projections must be known properties ⛔️`;
          expected: SimplifyDeep<ProjectionKey<TResultItem>>;
          actual: TProjectionMap[P];
        }>
    : /* Extract type from a [ProjectionKey, Parser] tuple, like ['slug.current', q.string() ] */
    TProjectionMap[P] extends readonly [infer TKey, infer TParser]
    ? TKey extends ProjectionKey<TResultItem>
      ? TParser extends Parser<infer TParserInput, infer TParserOutput>
        ? ValidateParserInput<
            ProjectionKeyValue<TResultItem, TKey>,
            TParserInput,
            TParserOutput
          >
        : TypeMismatchError<{
            error: `⛔️ Naked projections must be known properties ⛔️`;
            expected: SimplifyDeep<ProjectionKey<TResultItem>>;
            actual: TKey;
          }>
      : TypeMismatchError<{
          error: `⛔️ Naked projections must be known properties ⛔️`;
          expected: SimplifyDeep<ProjectionKey<TResultItem>>;
          actual: TKey;
        }>
    : /* Extract type from Parser: */
    TProjectionMap[P] extends Parser<infer TParserInput, infer TParserOutput>
    ? P extends keyof TResultItem
      ? ValidateParserInput<
          UndefinedToNull<TResultItem[P]>,
          TParserInput,
          TParserOutput
        >
      : TypeMismatchError<{
          error: `⛔️ Parser can only be used with known properties ⛔️`;
          expected: keyof TResultItem;
          actual: P;
        }>
    : never;
};

export type ValidateParserInput<TIncomingValue, TParserInput, TParserOutput> =
  // We need to ensure that the Parser accepts a WIDER input than the value:
  TIncomingValue extends TParserInput
    ? TParserOutput
    : IsAny<TIncomingValue> extends true // When using <any> for the schema
    ? TParserOutput
    : TypeMismatchError<{
        error: `⛔️ Parser expects a different input type ⛔️`;
        expected: TParserInput;
        actual: TIncomingValue;
      }>;
