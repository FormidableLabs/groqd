import { Empty, notNull, Simplify } from "../types/utils";
import { GroqBuilder } from "../groq-builder";
import { Parser, ParserFunction } from "../types/public-types";
import { isParser, normalizeValidationFunction } from "./validate-utils";
import { ResultItem, ResultOverride } from "../types/result-types";
import { ValidationErrors } from "../validation/validation-errors";
import { ExtractProjectionResult, ProjectionMap } from "./projection-types";
import {
  ConditionalProjectionResultWrapper,
  ExtractConditionalProjectionTypes,
} from "./conditional-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs an "object projection", returning an object with the fields specified.
     */
    project<
      TProjection extends ProjectionMap<ResultItem<TResult>>,
      TConditionals extends
        | ConditionalProjectionResultWrapper<any>
        | undefined = undefined
    >(
      projectionMap:
        | TProjection
        | ((q: GroqBuilder<ResultItem<TResult>, TRootConfig>) => TProjection),
      conditionalProjections?:
        | TConditionals
        | ((q: GroqBuilder<ResultItem<TResult>, TRootConfig>) => TConditionals)
    ): GroqBuilder<
      ResultOverride<
        TResult,
        Simplify<
          ExtractProjectionResult<ResultItem<TResult>, TProjection> &
            (TConditionals extends undefined
              ? Empty
              : ExtractConditionalProjectionTypes<TConditionals>)
        >
      >,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  project(
    this: GroqBuilder,
    projectionMapArg: object | ((q: any) => object),
    conditionalProjections?: object | ((q: any) => object)
  ): GroqBuilder<any> {
    // Retrieve the projectionMap:
    let projectionMap: object;
    if (typeof projectionMapArg === "function") {
      projectionMap = projectionMapArg(this.root);
    } else {
      projectionMap = projectionMapArg;
    }
    if (conditionalProjections) {
      if (typeof conditionalProjections === "function") {
        conditionalProjections = conditionalProjections(this.root);
      }
      // Just push the conditions into the `projectionMap` since the logic is the same
      Object.assign(projectionMap, conditionalProjections);
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
          const query = key === value ? key : `"${key}": ${value}`;
          return { key, query, parser: null };
        } else if (typeof value === "boolean") {
          if (value === false) return null; // 'false' will be excluded from the results
          return { key, query: key, parser: null };
        } else if (Array.isArray(value)) {
          const [projectionKey, parser] = value as [string, Parser];
          const query =
            key === projectionKey ? key : `"${key}": ${projectionKey}`;

          return {
            key,
            query,
            parser: normalizeValidationFunction(parser),
          };
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

    const { newLine, space } = this.indentation;

    const newQuery = ` {${newLine}${space}${queries.join(
      `,${newLine}${space}`
    )}${newLine}}`;

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

          if (validationErrors.length) {
            throw validationErrors;
          }

          return isArray ? parsedResults : parsedResults[0];
        };

    return this.chain(newQuery, newParser);
  },
});
