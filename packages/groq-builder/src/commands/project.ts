import { Empty, notNull, Simplify } from "../types/utils";
import { GroqBuilder } from "../groq-builder";
import { Parser, ParserFunction } from "../types/public-types";
import { isParser, normalizeValidationFunction } from "./validate-utils";
import { ResultItem, ResultOverride } from "../types/result-types";
import {
  ExtractProjectionResult,
  ProjectionFieldConfig,
  ProjectionMap,
} from "./projection-types";
import {
  ConditionalProjectionResultWrapper,
  ExtractConditionalProjectionTypes,
} from "./conditional-types";
import {
  objectValidation,
  ObjectValidationMap,
} from "../validation/object-shape";
import { arrayValidation } from "../validation/array-shape";

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
    conditionalProjectionsArg?
  ): GroqBuilder<any> {
    // Retrieve the projectionMap:
    let projectionMap: object;
    if (typeof projectionMapArg === "function") {
      projectionMap = projectionMapArg(this.root);
    } else {
      projectionMap = projectionMapArg;
    }

    let conditionalProjections:
      | ConditionalProjectionResultWrapper<any>
      | undefined;
    if (typeof conditionalProjectionsArg === "function") {
      conditionalProjections = conditionalProjectionsArg(this.root);
    } else {
      conditionalProjections = conditionalProjectionsArg;
    }

    // Compile query from projection values:
    const keys = Object.keys(projectionMap) as Array<string>;
    const fields = keys
      .map((key) => {
        const fieldConfig = projectionMap[key as keyof typeof projectionMap];
        return normalizeProjectionField(key, fieldConfig);
      })
      .filter(notNull);

    const queries = fields.map((v) => v.query);

    if (conditionalProjections) {
      queries.push(conditionalProjections.query);
    }

    const { newLine, space } = this.indentation;
    const newQuery = ` {${newLine}${space}${queries.join(
      `,${newLine}${space}`
    )}${newLine}}`;

    // Create a combined parser:
    let projectionParser: ParserFunction | null = null;
    if (fields.some((f) => f.parser)) {
      const objectShape = Object.fromEntries(
        fields.map((f) => [f.key, f.parser])
      );
      projectionParser = createProjectionParser(objectShape);
    }

    const conditionalParser = conditionalProjections?.parser;
    if (conditionalParser) {
      projectionParser = objectValidation.union(
        projectionParser || objectValidation.object(),
        conditionalParser
      );
    }

    return this.chain(newQuery, projectionParser);
  },
});

function normalizeProjectionField(
  key: string,
  fieldConfig: ProjectionFieldConfig<any, any>
): null | { key: string; query: string; parser: ParserFunction | null } {
  // Analyze the field configuration:
  const value: unknown = fieldConfig;
  if (value instanceof GroqBuilder) {
    const query = key === value.query ? key : `"${key}": ${value.query}`;
    return { key, query, parser: value.parser };
  } else if (typeof value === "string") {
    const query = key === value ? key : `"${key}": ${value}`;
    return { key, query, parser: null };
  } else if (typeof value === "boolean") {
    if (value === false) return null; // 'false' will be excluded from the results
    return { key, query: key, parser: null };
  } else if (Array.isArray(value)) {
    const [projectionKey, parser] = value as [string, Parser];
    const query = key === projectionKey ? key : `"${key}": ${projectionKey}`;

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
}

type UnknownObject = Record<string, unknown>;

function createProjectionParser(parsers: ObjectValidationMap): ParserFunction {
  const objectParser = objectValidation.object(parsers);
  const arrayParser = arrayValidation.array(objectParser);

  return function projectionParser(
    input: UnknownObject | Array<UnknownObject>
  ) {
    // Operates against either an array or a single item:
    if (!Array.isArray(input)) {
      return objectParser(input);
    }

    return arrayParser(input);
  };
}
