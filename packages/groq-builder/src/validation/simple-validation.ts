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
        validationErrors.add(`[${i}]`, value, err as Error);
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

  const keys = Object.keys(objectMapper) as Array<string>;
  const entries = keys.map(
    (key) =>
      [
        key,
        normalizeValidationFunction(
          objectMapper[key as keyof typeof objectMapper]
        ),
      ] as const
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
