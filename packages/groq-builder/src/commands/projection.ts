import {
  Get,
  MaybeArrayItem,
  Simplify,
  TypeMismatchError,
} from "../utils/type-utils";
import { GroqBuilder } from "../groq-builder";
import {
  ParserFunction,
  ParserObject,
  StringKeys,
} from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";
import { getParserFunction, isParser } from "./parse";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    projection<
      TProjectionString extends StringKeys<keyof MaybeArrayItem<TScope>>
    >(
      fieldName: TProjectionString | `${TProjectionString}[]`
    ): GroqBuilder<
      NonNullable<
        TScope extends Array<infer TScopeItem>
          ? Array<Get<TScopeItem, TProjectionString>>
          : Get<TScope, TProjectionString>
      >,
      TRootConfig
    >;

    projection<
      TProjection extends (TScope extends Array<infer TScopeItem>
        ? {
            [P in keyof TScopeItem]?: ProjectionFieldConfig;
          }
        : {
            [P in keyof TScope]?: ProjectionFieldConfig;
          }) & {
        [P in string]: ProjectionFieldConfig;
      }
    >(
      projectionMap:
        | TProjection
        | ((q: GroqBuilder<MaybeArrayItem<TScope>, TRootConfig>) => TProjection)
    ): GroqBuilder<
      TScope extends Array<infer TScopeItem>
        ? Array<Simplify<ExtractProjectionResult<TScopeItem, TProjection>>>
        : Simplify<ExtractProjectionResult<TScope, TProjection>>,
      TRootConfig
    >;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  export type ProjectionFieldConfig =
    // Use 'true' to include a field as-is
    | true
    // Use a parser to include a field, passing it through the parser at run-time
    | ParserObject<any, any>
    // Use a GroqBuilder instance to create a nested projection
    | GroqBuilder<any, any>;

  export type ExtractProjectionResult<TScope, TProjection> = {
    [P in keyof TProjection]: TProjection[P] extends GroqBuilder<
      infer TValue,
      any
    > // Extract type from GroqBuilder:
      ? TValue
      : /* Extract type from 'true': */
      TProjection[P] extends boolean
      ? P extends keyof TScope
        ? TScope[P]
        : TypeMismatchError<{
            error: `⛔️ 'true' can only be used for known properties ⛔️`;
            expected: keyof TScope;
            actual: P;
          }>
      : /* Extract type from ParserObject: */
      TProjection[P] extends ParserObject<infer TInput, infer TOutput>
      ? P extends keyof TScope
        ? TInput extends TScope[P]
          ? TOutput
          : TypeMismatchError<{
              error: `⛔️ Parser expects a different input type ⛔️`;
              expected: TScope[P];
              actual: TInput;
            }>
        : TypeMismatchError<{
            error: `⛔️ a parser can only be used for known properties ⛔️`;
            expected: keyof TScope;
            actual: P;
          }>
      : never;
  };
}

GroqBuilder.implement({
  projection(
    this: GroqBuilder<any, any>,
    arg: string | object | ((q: GroqBuilder<any, any>) => object)
  ) {
    if (typeof arg === "string") {
      let nakedProjection = arg;
      if (this.internal.query) {
        nakedProjection = "." + arg;
      }
      return this.chain(nakedProjection, null);
    }

    // Retrieve the projectionMap:
    let projectionMap: object;
    if (typeof arg === "function") {
      const newQ = new GroqBuilder({
        query: "",
        parser: null,
        parent: null,
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
    const newQuery = `{ ${queries.join(", ")} }`;

    type TScope = Record<string, unknown>;
    const parsers = values.filter((v) => v.parser);
    const newParser = !parsers.length
      ? null
      : function projectionParser(input: TScope) {
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
