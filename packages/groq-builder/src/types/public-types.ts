import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "./result-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Parser<TInput = any, TOutput = any> =
  | ParserObject<TInput, TOutput>
  | ParserFunction<TInput, TOutput>;

export type InferParserInput<TParser extends Parser> = TParser extends Parser<
  infer TInput
>
  ? TInput
  : never;
export type InferParserOutput<TParser extends Parser> = TParser extends Parser<
  any,
  infer TOutput
>
  ? TOutput
  : never;

/**
 * A generic "parser" which can take any input and output a parsed type.
 * This signature is compatible with Zod.
 */
export type ParserObject<TInput = any, TOutput = any> = {
  parse: ParserFunction<TInput, TOutput>;
};

/**
 * A generic "parser" which takes any input and outputs a parsed type.
 */
export type ParserFunction<TInput = any, TOutput = any> = (
  input: TInput
) => TOutput;

export type ParserFunctionMaybe<
  TInput = any,
  TOutput = any
> = null | ParserFunction<TInput, TOutput>;

/**
 * Extracts the Result type from a GroqBuilder query
 */
export type InferResultType<TGroqBuilder extends GroqBuilder> =
  TGroqBuilder extends GroqBuilder<infer TResultType, any>
    ? TResultType
    : never;

/**
 * Extracts the Result type for a single item from a GroqBuilder query
 */
export type InferResultItem<TGroqBuilder extends GroqBuilder> = ResultItem<
  InferResultType<TGroqBuilder>
>;
