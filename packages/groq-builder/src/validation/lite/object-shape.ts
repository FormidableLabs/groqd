import { createOptionalParser, OptionalParser } from "./primitives";
import {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
} from "../../types/public-types";
import { Simplify } from "../../types/utils";
import { ObjectValidationMap, simpleObjectParser } from "../simple-validation";

interface ObjectValidation {
  object<TResult>(): OptionalParser<TResult, TResult>;
  object<TMap extends ObjectValidationMap>(
    map?: TMap
  ): OptionalParser<
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
    return createOptionalParser(simpleObjectParser(map));
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
