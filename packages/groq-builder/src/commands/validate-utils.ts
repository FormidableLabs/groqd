import {
  Parser,
  ParserFunction,
  ParserFunctionMaybe,
  ParserObject,
} from "../types/public-types";

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

export function normalizeValidationFunction(parser: Parser): ParserFunction {
  if (isParserObject(parser)) {
    return (input) => parser.parse(input);
  }
  if (typeof parser === "function") return parser;

  throw new TypeError(`Parser must be a function or an object`);
}
