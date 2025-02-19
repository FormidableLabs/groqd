import {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
} from "../types/public-types";
import { ValidationErrors } from "./validation-errors";
import { Simplify } from "../types/utils";
import { normalizeValidationFunction } from "../commands/validate-utils";

/**
 * Pretty-prints the value
 */
export function inspect(value: unknown): string {
  if (value) {
    if (Array.isArray(value)) return "an array";
    if (typeof value === "object") return "an object";
  }
  return JSON.stringify(value);
}

/**
 * Validates (and maps) each item in an array.
 */
export function simpleArrayParser<TItemInput, TItemOutput>(
  itemParser: null | ParserFunction<TItemInput, TItemOutput>
): ParserFunction<Array<TItemInput>, Array<TItemOutput>> {
  if (!itemParser) {
    return (input) => {
      if (!Array.isArray(input)) {
        throw new TypeError(`Expected an array, received ${inspect(input)}`);
      }
      return input as unknown as Array<TItemOutput>;
    };
  }

  return (input) => {
    if (!Array.isArray(input)) {
      throw new TypeError(`Expected an array, received ${inspect(input)}`);
    }

    const validationErrors = new ValidationErrors();
    const results = input.map((value, i) => {
      try {
        return itemParser(value);
      } catch (err) {
        validationErrors.add(i, value, err as Error);
        return null as never;
      }
    });

    if (validationErrors.length) throw validationErrors;

    return results;
  };
}

/**
 * Validates (and maps) each key in an object.
 */
export function simpleObjectParser<TMap extends ObjectValidationMap>(
  objectMapper?: TMap
): ParserFunction<
  Simplify<{
    [P in keyof TMap]: TMap[P] extends Parser
      ? InferParserInput<TMap[P]>
      : unknown;
  }>,
  Simplify<{
    [P in keyof TMap]: TMap[P] extends Parser
      ? InferParserOutput<TMap[P]>
      : unknown;
  }>
> {
  if (!objectMapper) {
    return (input: unknown) => {
      if (input === null || typeof input !== "object") {
        throw new TypeError(`Expected an object, received ${inspect(input)}`);
      }
      return input as any;
    };
  }

  const entries = Object.entries(objectMapper).map(
    ([key, parser]) => [key, normalizeValidationFunction(parser)] as const
  );

  return (input) => {
    if (input === null || typeof input !== "object") {
      throw new TypeError(`Expected an object, received ${inspect(input)}`);
    }

    const validationErrors = new ValidationErrors();

    const result: any = {};
    for (const [key, parser] of entries) {
      const value = input[key as keyof typeof input];
      try {
        result[key] = parser ? parser(value) : value;
      } catch (err) {
        validationErrors.add(key, value, err as Error);
      }
    }

    if (validationErrors.length) throw validationErrors;
    return result;
  };
}

export type ObjectValidationMap = Record<string, Parser | null>;

type UnknownObject = Record<string, unknown>;
export type UnknownObjectParser = (input: UnknownObject) => UnknownObject;

/**
 * Combines multiple object parsers into a single parser
 */
export function combineObjectParsers(
  ...objectParsers: UnknownObjectParser[]
): UnknownObjectParser {
  // This is the most common use-case:
  if (objectParsers.length === 1) return objectParsers[0];

  return function combinedObjectParser(input) {
    const validationErrors = new ValidationErrors();
    const result = {};
    for (const p of objectParsers) {
      try {
        const parsed = p(input);
        Object.assign(result, parsed);
      } catch (err) {
        validationErrors.add(null, input, err as Error);
      }
    }

    if (validationErrors.length) throw validationErrors;

    return result;
  };
}

/**
 * Returns a parser that works against an array or a single item.
 */
export function maybeArrayParser<TItemInput, TItemOutput>(
  parser: null | ParserFunction<TItemInput, TItemOutput>
) {
  if (!parser) return null;
  const arrayParser = simpleArrayParser(parser);
  return function maybeArrayParser(input: TItemInput | Array<TItemInput>) {
    return Array.isArray(input) ? arrayParser(input) : parser(input);
  };
}

export function unionParser<TItemInput, TItemOutput>(
  parsers: Array<ParserFunction<TItemInput, TItemOutput>>
): ParserFunction<TItemInput, TItemOutput> {
  // Uncommon, but just in case:
  if (parsers.length === 1) return parsers[0];

  return function unionParser(input: TItemInput): TItemOutput {
    const errors = new ValidationErrors();
    for (const parser of parsers) {
      try {
        const result = parser(input);
        // We found a valid result!
        return result;
      } catch (err) {
        errors.add(null, input, err as Error);
      }
    }
    // We did not find any valid results; throw (all) errors:
    errors.add(
      null,
      input,
      new Error(
        `Expected the value to match one of the values above, but got ${inspect(
          input
        )}`
      )
    );
    throw errors;
  };
}
