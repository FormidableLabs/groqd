import {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
} from "../../types/public-types";
import { normalizeValidationFunction } from "../validate-utils";

export function nullToUndefined<TParser extends Parser>(
  parser: TParser
): ParserFunction<
  InferParserInput<TParser> | null,
  InferParserOutput<TParser>
> {
  const normalized = normalizeValidationFunction(parser)!;
  return (input) => normalized(input ?? undefined);
}
