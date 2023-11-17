import { MaybeArrayItem, Simplify, TypeMismatchError } from "../types/utils";
import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../types/public-types";
import { RootConfig } from "../types/schema-types";
import { getParserFunction, isParser } from "./parseUtils";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    projection<TProjectionKey extends ProjectionKey<MaybeArrayItem<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      TResult extends Array<infer TResultItem>
        ? Array<ProjectionKeyValue<TResultItem, TProjectionKey>>
        : ProjectionKeyValue<TResult, TProjectionKey>,
      TRootConfig
    >;

    projection<
      TProjection extends {
        [P in keyof MaybeArrayItem<TResult>]?: ProjectionFieldConfig;
      } & {
        [P in string]: ProjectionFieldConfig;
      } & {
        "..."?: true;
      }
    >(
      projectionMap:
        | TProjection
        | ((
            q: GroqBuilder<MaybeArrayItem<TResult>, TRootConfig>
          ) => TProjection)
    ): GroqBuilder<
      TResult extends Array<infer TResultItem>
        ? Array<Simplify<ExtractProjectionResult2<TResultItem, TProjection>>>
        : Simplify<ExtractProjectionResult2<TResult, TProjection>>,
      TRootConfig
    >;
  }

  export type ProjectionKey<TResultItem> =
    | Path<DeepRequired<TResultItem>>
    | `${PathsWithArrays<DeepRequired<TResultItem>>}[]`;

  export type ProjectionKeyValue<TResultItem, TKey> = PathValue<
    TResultItem,
    Extract<TKey extends `${infer TPath}[]` ? TPath : TKey, Path<TResultItem>>
  >;

  /**
   * Finds all paths that contain arrayss
   */
  type PathsWithArrays<TResultItem> = Extract<
    PathEntries<TResultItem>,
    [any, Array<any>]
  >[0];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  export type ProjectionFieldConfig =
    // Use 'true' to include a field as-is
    | true
    // Use a parser to include a field, passing it through the parser at run-time
    | ParserObject<any, any>
    // Use a GroqBuilder instance to create a nested projection
    | GroqBuilder;

  export type ExtractProjectionResult2<TResult, TProjection> =
    TProjection extends { "...": true }
      ? TResult & ExtractProjectionResult<TResult, Omit<TProjection, "...">>
      : ExtractProjectionResult<TResult, TProjection>;

  export type ExtractProjectionResult<TResult, TProjection> = {
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
            error: `⛔️ a parser can only be used for known properties ⛔️`;
            expected: keyof TResult;
            actual: P;
          }>
      : never;
  };
}

GroqBuilder.implement({
  projection(
    this: GroqBuilder,
    arg: string | object | ((q: GroqBuilder) => object)
  ) {
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
          return {
            key,
            query: key === value.query ? key : `"${key}": ${value.query}`,
            parser: value.internal.parser,
          };
        } else if (typeof value === "boolean") {
          if (value === false) return null; // 'false' will be excluded
          return { key, query: key, parser: null };
        } else if (isParser(value)) {
          return { key, query: key, parser: getParserFunction(value) };
        } else {
          throw new Error(
            `Unexpected value for projection key "${key}"` + typeof value
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
