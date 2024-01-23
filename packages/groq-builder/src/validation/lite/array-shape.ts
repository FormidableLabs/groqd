import {
  InferParserInput,
  InferParserOutput,
  Parser,
} from "../../types/public-types";
import { normalizeValidationFunction } from "../../commands/validate-utils";
import { Simplify } from "../../types/utils";
import { createOptionalParser, OptionalParser } from "./primitives";
import { simpleArrayParser } from "../simple-validation";

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
    const normalizedItemParser = normalizeValidationFunction(
      itemParser || null
    );
    const arrayParser = simpleArrayParser(normalizedItemParser);
    return createOptionalParser(arrayParser);
  },
};
