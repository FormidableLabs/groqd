import { Simplify, SimplifyDeep, TypeMismatchError } from "../types/utils";
import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../types/public-types";
import { normalizeValidationFunction, isParser } from "./validate-utils";
import { Path, PathEntries, PathValue } from "../types/path-types";
import { DeepRequired } from "../types/deep-required";
import { ResultItem, ResultOverride } from "../types/result-types";
import { ValidationErrors } from "../validation/validation-errors";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     * @param fieldName
     */
    project<TProjectionKey extends ProjectionKey<ResultItem<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultOverride<
        TResult,
        ProjectionKeyValue<ResultItem<TResult>, TProjectionKey>
      >,
      TRootConfig
    >;

    /**
     * Performs an "object projection", returning an object with the fields specified.
     * @param projectionMap
     */
    project<TProjection extends ProjectionMap<ResultItem<TResult>>>(
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

/**
 * Finds all paths that contain arrays
 */
type PathsWithArrays<TResultItem> = Extract<
  PathEntries<TResultItem>,
  [any, Array<any>]
>[0];

export type ProjectionKey<TResultItem> = Simplify<
  | Path<DeepRequired<TResultItem>>
  | `${PathsWithArrays<DeepRequired<TResultItem>>}[]`
>;

type ProjectionKeyValue<TResultItem, TKey> = PathValue<
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
  | ParserObject
  // Use a GroqBuilder instance to create a nested projection
  | GroqBuilder;

type ExtractProjectionResult<TResult, TProjectionMap> = TProjectionMap extends {
  "...": true;
}
  ? TResult & ExtractProjectionResultImpl<TResult, Omit<TProjectionMap, "...">>
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
    : /* Extract type from ParserObject: */
    TProjectionMap[P] extends ParserObject<infer TInput, infer TOutput>
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
  project(
    this: GroqBuilder,
    arg: string | object | ((q: GroqBuilder) => object)
  ): GroqBuilder<any> {
    if (typeof arg === "string") {
      let nakedProjection = arg;
      if (this.internal.query) {
        nakedProjection = "." + arg;
      }
      return this.chain<any>(nakedProjection, null);
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
          return {
            key,
            query: key,
            parser: normalizeValidationFunction(value),
          };
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
          const isArray = Array.isArray(input);
          const items = isArray ? input : [input];
          const validationErrors = new ValidationErrors();

          const parsedResults = items.map((item, i) => {
            const parsedResult = { ...item };

            for (const { key, parser } of parsers) {
              const value = item[key];
              try {
                const parsedValue = parser!(value);
                parsedResult[key] = parsedValue;
              } catch (err) {
                const path = isArray ? `[${i}].${key}` : key;
                validationErrors.add(path, value, err as Error);
              }
            }

            return parsedResult;
          });

          if (validationErrors.errors.length) {
            throw validationErrors;
          }

          return isArray ? parsedResults : parsedResults[0];
        };

    return this.chain(newQuery, newParser);
  },
});

function notNull<T>(value: T | null): value is T {
  return !!value;
}

/*
 * For backwards compatibility, we'll keep `grab` and `grabOne` as deprecated aliases:
 */
declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grab: GroqBuilder<TResult, TRootConfig>["project"];
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grab$: GroqBuilder<TResult, TRootConfig>["project"];
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grabOne: GroqBuilder<TResult, TRootConfig>["project"];
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grabOne$: GroqBuilder<TResult, TRootConfig>["project"];
  }
}
GroqBuilder.implement({
  grab: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grab' has been renamed to 'project' and will be removed in a future version"
    );
  }),
  grab$: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grab$' has been renamed to 'project' and will be removed in a future version"
    );
  }),
  grabOne: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grabOne' has been renamed to 'project' and will be removed in a future version"
    );
  }),
  grabOne$: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grabOne$' has been renamed to 'project' and will be removed in a future version"
    );
  }),
});

function deprecated<TMethod extends (...args: any[]) => any>(
  method: TMethod,
  logWarning: () => void
): TMethod {
  let logOnce = logWarning as null | typeof logWarning;
  return function (this: GroqBuilder, ...args) {
    if (logOnce) {
      logOnce();
      logOnce = null;
    }
    return method.apply(this, args);
  } as TMethod;
}
