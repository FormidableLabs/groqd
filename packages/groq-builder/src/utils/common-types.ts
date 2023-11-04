import { GroqBuilder } from "../groq-builder";

/**
 * A generic "parser" which can take any input and output a parsed type.
 * This signature is compatible with Zod.
 */
export type ParserObject<TInput, TOutput> = { parse(input: TInput): TOutput };

/**
 * A generic "parser" which takes any input and outputs a parsed type.
 */
export type ParserFunction<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Excludes symbol and number from keys, so that you only have strings.
 */
export type StringKeys<T> = Exclude<T, symbol | number>;

/**
 * Extracts the "Scope" type from a GroqBuilder
 */
export type ExtractScope<TGroqBuilder extends GroqBuilder<any, any>> =
  TGroqBuilder extends GroqBuilder<infer TScope, any> ? TScope : never;
