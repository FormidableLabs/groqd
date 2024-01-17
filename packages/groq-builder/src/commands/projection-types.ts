import { GroqBuilder } from "../groq-builder";
import {
  Empty,
  IsAny,
  Simplify,
  SimplifyDeep,
  StringKeys,
  TaggedUnwrap,
  TypeMismatchError,
  ValueOf,
} from "../types/utils";
import {
  FragmentInputTypeTag,
  IGroqBuilder,
  Parser,
} from "../types/public-types";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";
import { RootConfig } from "../types/schema-types";
import {
  ExtractConditionalProjectionTypes,
  OmitConditionalProjections,
} from "./conditional-types";

export type ProjectionKey<TResultItem> = IsAny<TResultItem> extends true
  ? string
  : ProjectionKeyImpl<Simplify<PathEntries<DeepRequired<TResultItem>>>>;
type ProjectionKeyImpl<Entries> = ValueOf<{
  [Key in keyof Entries]: Entries[Key] extends Array<any>
    ? `${StringKeys<Key>}[]` | Key
    : Key;
}>;

export type ProjectionKeyValue<TResultItem, TKey> = PathValue<
  TResultItem,
  Extract<TKey extends `${infer TPath}[]` ? TPath : TKey, Path<TResultItem>>
>;

export type ProjectionMap<TResultItem> = {
  // This allows TypeScript to suggest known keys:
  [P in keyof TResultItem]?: ProjectionFieldConfig<TResultItem, TResultItem[P]>;
} & {
  // This allows any keys to be used in a projection:
  [P in string]: ProjectionFieldConfig<TResultItem, never>;
} & {
  // Obviously this allows the ellipsis operator:
  "..."?: true;
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
  | Parser<TFieldType>
  // Use a tuple for naked projections with a parser
  | [ProjectionKey<TResultItem>, Parser<TFieldType>]
  // Use a GroqBuilder instance to create a nested projection
  | IGroqBuilder;

export type ExtractProjectionResult<TResultItem, TProjectionMap> =
  (TProjectionMap extends { "...": true } ? TResultItem : Empty) &
    ExtractProjectionResultImpl<
      TResultItem,
      Omit<
        OmitConditionalProjections<TProjectionMap>,
        // Ensure we remove any "tags" that we don't want in the mapped type:
        "..." | typeof FragmentInputTypeTag
      >
    > &
    ExtractConditionalProjectionTypes<TProjectionMap>;

type ExtractProjectionResultImpl<TResultItem, TProjectionMap> = {
  [P in keyof TProjectionMap]: TProjectionMap[P] extends IGroqBuilder<
    infer TValue
  > // Extract type from GroqBuilder:
    ? TValue
    : /* Extract type from 'true': */
    TProjectionMap[P] extends boolean
    ? P extends keyof TResultItem
      ? TResultItem[P]
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
    TProjectionMap[P] extends [infer TKey, infer TParser]
    ? TKey extends ProjectionKey<TResultItem>
      ? TParser extends Parser<infer TInput, infer TOutput>
        ? TInput extends ProjectionKeyValue<TResultItem, TKey>
          ? TOutput
          : TypeMismatchError<{
              error: `⛔️ The value of the projection is not compatible with this parser ⛔️`;
              expected: Parser<ProjectionKeyValue<TResultItem, TKey>, TOutput>;
              actual: TParser;
            }>
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
    TProjectionMap[P] extends Parser<infer TExpectedInput, infer TOutput>
    ? P extends keyof TResultItem
      ? TResultItem[P] extends TExpectedInput
        ? TOutput
        : IsAny<TResultItem[P]> extends true // When using <any> for the schema
        ? TOutput
        : TypeMismatchError<{
            error: `⛔️ Parser expects a different input type ⛔️`;
            expected: TExpectedInput;
            actual: TResultItem[P];
          }>
      : TypeMismatchError<{
          error: `⛔️ Parser can only be used with known properties ⛔️`;
          expected: keyof TResultItem;
          actual: P;
        }>
    : never;
};
