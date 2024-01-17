import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "./result-types";
import { Simplify, Tagged } from "./utils";
import { ExtractProjectionResult } from "../commands/projection-types";

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
export type InferResultType<TGroqBuilder extends IGroqBuilder<any>> =
  TGroqBuilder extends IGroqBuilder<infer TResultType> ? TResultType : never;

/**
 * Extracts the Result type for a single item from a GroqBuilder query
 */
export type InferResultItem<TGroqBuilder extends GroqBuilder> = ResultItem<
  InferResultType<TGroqBuilder>
>;

export declare const GroqBuilderResultType: unique symbol;
// This is used to prevent circular references
export type IGroqBuilder<TResult = unknown> = {
  readonly [GroqBuilderResultType]: TResult;
  query: string;
  parser: ParserFunction | null;
};
export type InferResultType2<TGroqBuilder extends IGroqBuilder<any>> =
  TGroqBuilder extends IGroqBuilder<infer TResult> ? TResult : never;

export declare const FragmentInputTypeTag: unique symbol;
export type Fragment<
  TProjectionMap,
  TFragmentInput // This is used to capture the type, to be extracted by `InferFragmentType`
> = TProjectionMap & { readonly [FragmentInputTypeTag]?: TFragmentInput };

export type InferFragmentType<TFragment extends Fragment<any, any>> =
  TFragment extends Fragment<infer TProjectionMap, infer TFragmentInput>
    ? Simplify<ExtractProjectionResult<TFragmentInput, TProjectionMap>>
    : never;
