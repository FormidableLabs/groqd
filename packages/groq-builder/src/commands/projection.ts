import { Simplify, SimplifyDeep, TypeMismatchError } from "../types/utils";
import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../types/public-types";
import { getParserFunction, isParser } from "./parseUtils";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    projection<TProjectionKey extends ProjectionKey<ResultItem<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultOverride<
        TResult,
        ProjectionKeyValue<ResultItem<TResult>, TProjectionKey>
      >,
      TRootConfig
    >;

    projection<
      TProjection extends {
        // This allows TypeScript to suggest known keys:
        [P in keyof ResultItem<TResult>]?: ProjectionFieldConfig<TResult>;
      } & {
        // This allows any keys to be used in a projection:
        [P in string]: ProjectionFieldConfig<TResult>;
      } & {
        // Obviously this allows the ellipsis operator:
        "..."?: true;
      }
    >(
      projectionMap:
        | TProjection
        | ((q: GroqBuilder<ResultItem<TResult>, TRootConfig>) => TProjection)
    ): GroqBuilder<
      ResultOverride<
        TResult,
        Simplify<ExtractProjectionResult<ResultItem<TResult>, TProjection>>
      >,
      TRootConfig
    >;
  }
}

export type ProjectionKey<TResultItem> = Simplify<
  | Path<DeepRequired<TResultItem>>
  | `${PathsWithArrays<DeepRequired<TResultItem>>}[]`
>;

type ProjectionKeyValue<TResultItem, TKey> = PathValue<
  TResultItem,
  Extract<TKey extends `${infer TPath}[]` ? TPath : TKey, Path<TResultItem>>
>;

/**
 * Finds all paths that contain arrays
 */
type PathsWithArrays<TResultItem> = Extract<
  PathEntries<TResultItem>,
  [any, Array<any>]
>[0];

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProjectionFieldConfig<TResult> =
  // Use 'true' to include a field as-is
  | true
  // Use a string for naked projections, like 'slug.current'
  | ProjectionKey<ResultItem<TResult>>
  // | string
  // Use a parser to include a field, passing it through the parser at run-time
  | ParserObject
  // Use a GroqBuilder instance to create a nested projection
  | GroqBuilder;

type ExtractProjectionResult<TResult, TProjection> = TProjection extends {
  "...": true;
}
  ? TResult & ExtractProjectionResultImpl<TResult, Omit<TProjection, "...">>
  : ExtractProjectionResultImpl<TResult, TProjection>;

type ExtractProjectionResultImpl<TResult, TProjection> = {
  [P in keyof TProjection]: TProjection[P] extends GroqBuilder<
    infer TValue,
    any
  > // Extract type from GroqBuilder:
    ? TValue
    : /* Extract type from 'true': */
    TProjection[P] extends boolean
    ? P extends keyof TResult
      ? TResult[P]
      : TypeMismatchError<{
          error: `⛔️ 'true' can only be used for known properties ⛔️`;
          expected: keyof TResult;
          actual: P;
        }>
    : /* Extract type from a ProjectionKey string, like 'slug.current': */
    TProjection[P] extends string
    ? TProjection[P] extends ProjectionKey<TResult>
      ? ProjectionKeyValue<TResult, TProjection[P]>
      : TypeMismatchError<{
          error: `⛔️ Naked projections must be known properties ⛔️`;
          expected: SimplifyDeep<ProjectionKey<TResult>>;
          actual: TProjection[P];
        }>
    : /* Extract type from ParserObject: */
    TProjection[P] extends ParserObject<infer TInput, infer TOutput>
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

GroqBuilder.implement({
  projection(
    this: GroqBuilder,
    arg: string | object | ((q: GroqBuilder) => object)
  ): GroqBuilder<any> {
    if (typeof arg === "string") {
      let nakedProjection = arg;
      if (this.internal.query) {
        nakedProjection = "." + arg;
      }
      return this.chain(nakedProjection, null);
    }

    const indent = this.internal.options.indent;
    const indent2 = indent ? indent + "  " : "";

    // Retrieve the projectionMap:
    let projectionMap: object;
    if (typeof arg === "function") {
      const newQ = new GroqBuilder({
        query: "",
        parser: null,
        options: {
          ...this.internal.options,
          indent: indent2,
        },
      });
      projectionMap = arg(newQ);
    } else {
      projectionMap = arg;
    }

    // Analyze all the projection values:
    const keys = Object.keys(projectionMap) as Array<string>;
    const values = keys
      .map<null | {
        key: string;
        query: string;
        parser: ParserFunction | null;
      }>((key) => {
        const value: unknown = projectionMap[key as keyof typeof projectionMap];
        if (value instanceof GroqBuilder) {
          const query = key === value.query ? key : `"${key}": ${value.query}`;
          return { key, query, parser: value.internal.parser };
        } else if (typeof value === "string") {
          const query = key === value ? value : `"${key}": ${value}`;
          return { key, query, parser: null };
        } else if (typeof value === "boolean") {
          if (value === false) return null; // 'false' will be excluded from the results
          return { key, query: key, parser: null };
        } else if (isParser(value)) {
          return { key, query: key, parser: getParserFunction(value) };
        } else {
          throw new Error(
            `Unexpected value for projection key "${key}": "${typeof value}"`
          );
        }
      })
      .filter(notNull);

    const queries = values.map((v) => v.query);
    const newLine = indent ? "\n" : " ";
    const newQuery = ` {${newLine}${indent2}${queries.join(
      "," + newLine + indent2
    )}${newLine}${indent}}`;

    type TResult = Record<string, unknown>;
    const parsers = values.filter((v) => v.parser);
    const newParser = !parsers.length
      ? null
      : function projectionParser(input: TResult) {
          const items = Array.isArray(input) ? input : [input];
          const parsedResults = items.map((item) => {
            const parsedResult = { ...item };
            parsers.forEach(({ key, parser }) => {
              const value = item[key];
              const parsedValue = parser!(value);
              parsedResult[key] = parsedValue;
            });
            return parsedResult;
          });
          return Array.isArray(items) ? parsedResults : parsedResults[0];
        };

    return this.chain(newQuery, newParser);
  },
});

function notNull<T>(value: T | null): value is T {
  return !!value;
}
