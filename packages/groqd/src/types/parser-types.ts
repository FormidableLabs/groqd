import type { ZodType } from "./zod-like";

/**
 * A Parser is either a generic mapping function, or a Zod schema.
 * It's used for run-time validation and/or transformation
 * of the results of a field.
 */
export type Parser<TInput = any, TOutput = any> =
  | ParserFunction<TInput, TOutput>
  | ZodType<TOutput, any, TInput>;

/**
 * Same as `Parser`, except it allows for wider input types,
 * so that a value of `string` can be handled
 * by a parser that accepts `string | null` etc.
 */
export type ParserWithWidenedInput<TInput> =
  // TypeScript automatically widens the parameters of a function:
  | ParserFunction<TInput, any>
  // TypeScript doesn't widen types for the ZodType signature;
  // (but we type-check this manually in the ExtractProjectionResult)
  | ZodType<any, any, any>;

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
 * A generic "parser" object which can take any input and output a parsed type.
 */
export type ParserObject<TInput = any, TOutput = any> = {
  parse: ParserFunction<TInput, TOutput>;
};

/**
 * A generic "parser" function which takes any input and outputs a parsed type.
 */
export type ParserFunction<TInput = any, TOutput = any> = (
  input: TInput
) => TOutput;

export type ParserFunctionMaybe<
  TInput = any,
  TOutput = any
> = null | ParserFunction<TInput, TOutput>;
