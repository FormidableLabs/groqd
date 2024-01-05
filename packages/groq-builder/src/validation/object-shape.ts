import { createOptionalParser, inspect, OptionalParser } from "./primitives";
import {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
} from "../types/public-types";
import { Simplify } from "../types/utils";
import { normalizeValidationFunction } from "../commands/validate-utils";
import { ValidationErrors } from "./validation-errors";

interface ObjectValidation {
  object(): OptionalParser<object, object>;
  object<TMap extends ObjectValidationMap>(
    map?: TMap
  ): OptionalParser<
    Simplify<{
      [P in keyof TMap]: TMap[P] extends {}
        ? InferParserInput<TMap[P]>
        : unknown;
    }>,
    Simplify<{
      [P in keyof TMap]: TMap[P] extends {}
        ? InferParserOutput<TMap[P]>
        : unknown;
    }>
  >;

  union<TParserA extends ParserFunction, TParserB extends ParserFunction>(
    parserA: TParserA,
    parserB: TParserB
  ): OptionalParser<
    InferParserInput<TParserA> & InferParserInput<TParserB>,
    InferParserOutput<TParserA> & InferParserOutput<TParserB>
  >;
}

export const objectValidation: ObjectValidation = {
  object(map?: ObjectValidationMap) {
    if (!map) {
      return createOptionalParser((input) => {
        if (input === null || typeof input !== "object") {
          throw new TypeError(`Expected an object, received ${inspect(input)}`);
        }
        return input;
      });
    }

    const keys = Object.keys(map) as Array<string>;
    const normalized = keys.map(
      (key) =>
        [
          key,
          normalizeValidationFunction(map[key as keyof typeof map]),
        ] as const
    );
    return createOptionalParser((input) => {
      if (input === null || typeof input !== "object") {
        throw new TypeError(`Expected an object, received ${inspect(input)}`);
      }

      const validationErrors = new ValidationErrors();

      const result: any = {};
      for (const [key, parse] of normalized) {
        const value = input[key as keyof typeof input];
        try {
          result[key] = parse ? parse(value) : value;
        } catch (err) {
          validationErrors.add(key, value, err as Error);
        }
      }

      if (validationErrors.length) throw validationErrors;
      return result;
    });
  },

  union(parserA, parserB) {
    return createOptionalParser((input) => {
      return {
        ...parserA(input),
        ...parserB(input),
      };
    });
  },
};

export type ObjectValidationMap = Record<string, Parser | null>;
