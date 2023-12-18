import { GroqBuilder } from "../groq-builder";
import {
  Simplify,
  SimplifyDeep,
  StringKeys,
  TypeMismatchError,
  ValueOf,
} from "../types/utils";
import { Parser } from "../types/public-types";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";

export type ProjectionKey<TResultItem> = ProjectionKeyImpl<
  Simplify<PathEntries<DeepRequired<TResultItem>>>
>;
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
  [P in keyof TResultItem]?: ProjectionFieldConfig<TResultItem>;
} & {
  // This allows any keys to be used in a projection:
  [P in string]: ProjectionFieldConfig<TResultItem>;
} & {
  // Obviously this allows the ellipsis operator:
  "..."?: true;
};

type ProjectionFieldConfig<TResultItem> =
  // Use 'true' to include a field as-is
  | true
  // Use a string for naked projections, like 'slug.current'
  | ProjectionKey<TResultItem>
  // Use a parser to include a field, passing it through the parser at run-time
  | Parser
  // Use a tuple for naked projections with a parser
  | [ProjectionKey<TResultItem>, Parser]
  // Use a GroqBuilder instance to create a nested projection
  | GroqBuilder;

export type ExtractProjectionResult<TResult, TProjectionMap> =
  TProjectionMap extends {
    "...": true;
  }
    ? TResult &
        ExtractProjectionResultImpl<TResult, Omit<TProjectionMap, "...">>
    : ExtractProjectionResultImpl<TResult, TProjectionMap>;

type ExtractProjectionResultImpl<TResult, TProjectionMap> = {
  [P in keyof TProjectionMap]: TProjectionMap[P] extends GroqBuilder<
    infer TValue,
    any
  > // Extract type from GroqBuilder:
    ? TValue
    : /* Extract type from 'true': */
    TProjectionMap[P] extends boolean
    ? P extends keyof TResult
      ? TResult[P]
      : TypeMismatchError<{
          error: `⛔️ 'true' can only be used for known properties ⛔️`;
          expected: keyof TResult;
          actual: P;
        }>
    : /* Extract type from a ProjectionKey string, like 'slug.current': */
    TProjectionMap[P] extends string
    ? TProjectionMap[P] extends ProjectionKey<TResult>
      ? ProjectionKeyValue<TResult, TProjectionMap[P]>
      : TypeMismatchError<{
          error: `⛔️ Naked projections must be known properties ⛔️`;
          expected: SimplifyDeep<ProjectionKey<TResult>>;
          actual: TProjectionMap[P];
        }>
    : /* Extract type from a [ProjectionKey, Parser] tuple, like ['slug.current', q.string() ] */
    TProjectionMap[P] extends [infer TKey, infer TParser]
    ? TKey extends ProjectionKey<TResult>
      ? TParser extends Parser<infer TInput, infer TOutput>
        ? TInput extends ProjectionKeyValue<TResult, TKey>
          ? TOutput
          : TypeMismatchError<{
              error: `⛔️ The value of the projection is not compatible with this parser ⛔️`;
              expected: Parser<ProjectionKeyValue<TResult, TKey>, TOutput>;
              actual: TParser;
            }>
        : TypeMismatchError<{
            error: `⛔️ Naked projections must be known properties ⛔️`;
            expected: SimplifyDeep<ProjectionKey<TResult>>;
            actual: TKey;
          }>
      : TypeMismatchError<{
          error: `⛔️ Naked projections must be known properties ⛔️`;
          expected: SimplifyDeep<ProjectionKey<TResult>>;
          actual: TKey;
        }>
    : /* Extract type from Parser: */
    TProjectionMap[P] extends Parser<infer TInput, infer TOutput>
    ? P extends keyof TResult
      ? TInput extends TResult[P]
        ? TOutput
        : TypeMismatchError<{
            error: `⛔️ Parser expects a different input type ⛔️`;
            expected: TResult[P];
            actual: TInput;
          }>
      : TypeMismatchError<{
          error: `⛔️ Parser can only be used with known properties ⛔️`;
          expected: keyof TResult;
          actual: P;
        }>
    : never;
};
