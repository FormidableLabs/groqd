import {
  Parser,
  ParserFunction,
  ParserFunctionMaybe,
  ParserObject,
} from "../types/parser-types";
import { InvalidQueryError } from "../types/invalid-query-error";

export function chainParsers(
  a: ParserFunctionMaybe,
  b: ParserFunctionMaybe
): ParserFunctionMaybe {
  if (a && b) {
    return (input: any) => b(a(input));
  }
  return a || b || null;
}

export function isParser(value: unknown): value is Parser<unknown, unknown> {
  if (typeof value === "function") return true;
  return isParserObject(value);
}

export function isParserObject(
  value: unknown
): value is ParserObject<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "parse" in value &&
    typeof value.parse === "function"
  );
}

export function normalizeValidationFunction(
  parser: Parser | null | undefined
): ParserFunction | null {
  if (!parser) {
    return null;
  }
  if (typeof parser === "function") {
    return parser;
  }
  if (isParserObject(parser)) {
    return (input) => parser.parse(input);
  }

  throw new InvalidQueryError(
    "INVALID_PARSER",
    `Parser must be a function or an object`,
    { parser }
  );
}
