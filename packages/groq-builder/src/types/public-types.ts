import type { ZodType } from "zod";
import type { GroqBuilder } from "../groq-builder";
import type { ResultItem } from "./result-types";
import type { Simplify } from "./utils";
import type { ExtractProjectionResult } from "../commands/projection-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

/**
 * Extracts the Result type from a GroqBuilder query
 */
export type InferResultType<TGroqBuilder extends IGroqBuilder<any>> =
  TGroqBuilder extends IGroqBuilder<infer TResultType> ? TResultType : never;

/**
 * Extracts the Result type for a single item from a GroqBuilder query
 */
export type InferResultItem<TGroqBuilder extends GroqBuilder> =
  ResultItem.Infer<InferResultType<TGroqBuilder>>;

/**
 * Used to store the Result types of a GroqBuilder.
 * This symbol is not used at runtime.
 */
export declare const GroqBuilderResultType: unique symbol;
/**
 * IGroqBuilder is the bare minimum GroqBuilder, used to prevent circular references
 */
export type IGroqBuilder<TResult = unknown> = {
  readonly [GroqBuilderResultType]: TResult;
  query: string;
  parser: ParserFunction | null;
};

/**
 * Used to store the Result types of a Fragment.
 * This symbol is not used at runtime.
 */
export declare const FragmentInputTypeTag: unique symbol;
export type Fragment<
  TProjectionMap,
  TFragmentInput // This is used to capture the type, to be extracted by `InferFragmentType`
> = TProjectionMap & { readonly [FragmentInputTypeTag]?: TFragmentInput };

/**
 * Infers the result types of a fragment.
 * @example
 * const productFragment = q.fragment<Product>().project({
 *   name: q.string(),
 *   price: q.number(),
 * });
 *
 * type ProductFragment = InferFragmentType<typeof productFragment>;
 */
export type InferFragmentType<TFragment extends Fragment<any, any>> =
  TFragment extends Fragment<infer TProjectionMap, infer TFragmentInput>
    ? Simplify<ExtractProjectionResult<TFragmentInput, TProjectionMap>>
    : never;
