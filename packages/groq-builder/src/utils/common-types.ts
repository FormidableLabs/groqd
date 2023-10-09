import { GroqBuilder } from "../groq-builder";

/**
 * A generic "parser" which can take any input and output a parsed type.
 * This signature is compatible with Zod.
 */
export type Parser<TInput, TOutput> = { parse(input: TInput): TOutput };

export type StringKeys<T> = Exclude<T, symbol | number>;

export type ExtractScope<TGroqBuilder extends GroqBuilder<any, any>> =
  TGroqBuilder extends GroqBuilder<infer TScope, infer TRootConfig>
    ? TScope
    : never;
