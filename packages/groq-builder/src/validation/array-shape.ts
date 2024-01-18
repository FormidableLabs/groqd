import {
  InferParserInput,
  InferParserOutput,
  Parser,
} from "../types/public-types";
import { normalizeValidationFunction } from "../commands/validate-utils";
import { Simplify } from "../types/utils";
import { ValidationErrors } from "./validation-errors";
import { createOptionalParser, inspect, OptionalParser } from "./primitives";

export interface ArrayValidation {
  array<TItem>(): OptionalParser<Array<TItem>, Array<TItem>>;
  array<TParser extends Parser>(
    itemParser: TParser
  ): OptionalParser<
    Array<Simplify<InferParserInput<TParser>>>,
    Array<Simplify<InferParserOutput<TParser>>>
  >;
}

export const arrayValidation: ArrayValidation = {
  array(itemParser?: Parser) {
    if (!itemParser) {
      return createOptionalParser((input) => {
        if (!Array.isArray(input)) {
          throw new TypeError(`Expected an array, received ${inspect(input)}`);
        }
        return input;
      });
    }

    const normalizedItemParser = normalizeValidationFunction(itemParser)!;

    return createOptionalParser((input) => {
      if (!Array.isArray(input)) {
        throw new TypeError(`Expected an array, received ${inspect(input)}`);
      }

      const validationErrors = new ValidationErrors();
      const results = input.map((value, i) => {
        try {
          return normalizedItemParser(value);
        } catch (err) {
          validationErrors.add(`[${i}]`, value, err as Error);
          return null;
        }
      });

      if (validationErrors.length) throw validationErrors;

      return results;
    });
  },
};
