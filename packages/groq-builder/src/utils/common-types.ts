import { GroqBuilder } from "../groq-builder";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Parser<TInput = any, TOutput = any> =
  | ParserObject<TInput, TOutput>
  | ParserFunction<TInput, TOutput>;

/**
 * A generic "parser" which can take any input and output a parsed type.
 * This signature is compatible with Zod.
 */
export type ParserObject<TInput = any, TOutput = any> = {
  parse(input: TInput): TOutput;
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
 * Excludes symbol and number from keys, so that you only have strings.
 */
export type StringKeys<T> = Exclude<T, symbol | number>;

/**
 * Extracts the "Scope" type from a GroqBuilder
 */
export type QueryResultType<TGroqBuilder extends GroqBuilder<any, any>> =
  TGroqBuilder extends GroqBuilder<infer TResult, any> ? TResult : never;
