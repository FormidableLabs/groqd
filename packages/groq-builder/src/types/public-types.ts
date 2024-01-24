import type { ZodType } from "zod";
import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "./result-types";
import { Simplify } from "./utils";
import { ExtractProjectionResult } from "../commands/projection-types";
import { ZodTypeDef } from "zod/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Parser<TInput = any, TOutput = any> =
  | ZodType<TOutput, ZodTypeDef, TInput>
  // | ParserObject<TInput, TOutput>
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
