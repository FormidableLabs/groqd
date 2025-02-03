import { notNull, Simplify } from "../types/utils";
import { RequireAFakeParameterIfThereAreTypeMismatchErrors } from "../types/type-mismatch-error";
import { GroqBuilder } from "../groq-builder";
import { Parser, ParserFunction } from "../types/public-types";
import { isParser, normalizeValidationFunction } from "./validate-utils";
import { ResultItem } from "../types/result-types";
import {
  ExtractProjectionResult,
  ProjectionFieldConfig,
  ProjectionMap,
} from "./projection-types";
import { isConditional } from "./conditional-types";
import {
  combineObjectParsers,
  maybeArrayParser,
  simpleObjectParser,
  UnknownObjectParser,
} from "../validation/simple-validation";
import { InvalidQueryError } from "../types/invalid-query-error";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Performs an "object projection", returning an object with the fields specified.
     *
     * @param projectionMap - The projection map is an object, mapping field names to projection values
     * @param __projectionMapTypeMismatchErrors - (internal; this is only used for reporting errors from the projection)
     */
    project<
      TProjection extends ProjectionMap<ResultItem.Infer<TResult>>,
      _TProjectionResult = ExtractProjectionResult<
        ResultItem.Infer<TResult>,
        TProjection
      >
    >(
      projectionMap:
        | TProjection
        | ((
            q: GroqBuilder<ResultItem.Infer<TResult>, TQueryConfig>
          ) => TProjection),
      ...__projectionMapTypeMismatchErrors: RequireAFakeParameterIfThereAreTypeMismatchErrors<_TProjectionResult>
    ): GroqBuilder<
      ResultItem.Override<TResult, Simplify<_TProjectionResult>>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  project(
    this: GroqBuilder,
    projectionMapArg: object | ((q: any) => object),
    ...__projectionMapTypeMismatchErrors
  ): GroqBuilder<any> {
    // Retrieve the projectionMap:
    let projectionMap: object;
    if (typeof projectionMapArg === "function") {
      projectionMap = projectionMapArg(this.root);
    } else {
      projectionMap = projectionMapArg;
    }

    const keys = Object.keys(projectionMap) as Array<string>;

    // Compile query from projection values:
    const fields = keys
      .map((key) => {
        const fieldConfig = projectionMap[key as keyof typeof projectionMap];
        return normalizeProjectionField(key, fieldConfig);
      })
      .filter(notNull);

    if (this.internal.options.validationRequired) {
      // Validate that we have provided validation functions for all fields:
      const invalidFields = fields.filter((f) => !f.parser);
      if (invalidFields.length) {
        throw new InvalidQueryError(
          "MISSING_PROJECTION_VALIDATION",
          "Because 'validationRequired' is enabled, " +
            "every field must have validation (like `q.string()`), " +
            "but the following fields are missing it: " +
            `${invalidFields.map((f) => `"${f.key}"`)}`
        );
      }
    }

    const queries = fields.map((v) => v.query);
    const { newLine, space } = this.indentation;
    const newQuery = ` {${newLine}${space}${queries.join(
      `,${newLine}${space}`
    )}${newLine}}`;

    // Create a combined parser:
    const projectionParser = createProjectionParser(fields);

    return this.chain(newQuery, projectionParser);
  },
});

function normalizeProjectionField(
  key: string,
  fieldConfig: ProjectionFieldConfig<any, any>
): null | NormalizedProjectionField {
  // Analyze the field configuration:
  const value: unknown = fieldConfig;
  if (value instanceof GroqBuilder) {
    const query = isConditional(key) // Conditionals can ignore the key
      ? value.query
      : key === value.query // Use shorthand syntax
      ? key
      : `"${key}": ${value.query}`;
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
    throw new InvalidQueryError(
      "INVALID_PROJECTION_VALUE",
      `Unexpected value for projection key "${key}": "${typeof value}"`
    );
  }
}

type NormalizedProjectionField = {
  key: string;
  query: string;
  parser: ParserFunction | null;
};

function createProjectionParser(
  fields: NormalizedProjectionField[]
): ParserFunction | null {
  if (!fields.some((f) => f.parser)) {
    // No parsers found for any keys
    return null;
  }

  // Parse the ellipsis operator ("..."):
  const ellipsisField = fields.find((f) => isEllipsis(f.key));
  const ellipsisParser: UnknownObjectParser | null = ellipsisField
    ? // Allow a custom parser:
      ellipsisField.parser ||
      // Or just pass-through the whole object:
      ((obj) => obj)
    : null;

  // Parse all normal fields:
  const normalFields = fields.filter(
    (f) => !isEllipsis(f.key) && !isConditional(f.key)
  );
  const objectShape = Object.fromEntries(
    normalFields.map((f) => [f.key, f.parser])
  );
  const objectParser = simpleObjectParser(objectShape);

  // Parse all conditional fields:
  const conditionalFields = fields.filter((f) => isConditional(f.key));
  const conditionalParsers = conditionalFields
    .map((f) => f.parser)
    .filter(notNull);

  // Combine normal and conditional parsers:
  const combinedParser = combineObjectParsers(
    ...[ellipsisParser].filter(notNull),
    objectParser,
    ...conditionalParsers
  );

  // Finally, transparently handle arrays or objects:
  return maybeArrayParser(combinedParser);
}

function isEllipsis(key: string) {
  return key === "...";
}
