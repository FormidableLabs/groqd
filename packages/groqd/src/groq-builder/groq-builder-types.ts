import type { QueryConfig } from "../types/query-config";
import type { ResultItem } from "../types/result-types";
import { ParserFunction } from "../types/parser-types";

// Not used at runtime, just used to infer types:
export declare const GroqBuilderResultType: unique symbol;
export declare const GroqBuilderConfigType: unique symbol;
/**
 * IGroqBuilder contains the minimum results of a GroqBuilder chain,
 * used to prevent circular references
 */
export type IGroqBuilder<
  TResult = unknown,
  TQueryConfig extends QueryConfig = QueryConfig
> = {
  /**
   * Used to infer the TResult types of a GroqBuilder.
   * This symbol is not used at runtime.
   * @internal
   */
  readonly [GroqBuilderResultType]: TResult;
  /**
   * Used to infer the TQueryConfig types of a GroqBuilder.
   * This symbol is not used at runtime
   * @internal
   */
  readonly [GroqBuilderConfigType]: TQueryConfig;
  /**
   * The GROQ query as a string
   */
  readonly query: string;
  /**
   * The parser function that should be used to parse result data
   */
  readonly parser: ParserFunction | null;
  /**
   * Parses and validates the query results, passing all data through the parsers.
   */
  readonly parse: ParserFunction;
};

export function isGroqBuilder(
  fieldConfig: unknown
): fieldConfig is IGroqBuilder {
  return (
    !!fieldConfig &&
    typeof fieldConfig === "object" &&
    "query" in fieldConfig &&
    "parse" in fieldConfig &&
    typeof fieldConfig.query === "string" &&
    typeof fieldConfig.parse === "function"
  );
}

/**
 * Represents a GroqBuilder chain that is "terminal",
 * and should not be further chained.
 */
export type IGroqBuilderNotChainable<
  TResult,
  TQueryConfig extends QueryConfig
> = IGroqBuilder<TResult, TQueryConfig>;
/**
 * Extracts the Result type from a GroqBuilder query
 */
export type InferResultType<TGroqBuilder extends IGroqBuilder<any>> =
  TGroqBuilder extends IGroqBuilder<infer TResultType> ? TResultType : never;
/**
 * Extracts the Result type for a single item from a GroqBuilder query
 */
export type InferResultItem<TGroqBuilder extends IGroqBuilder<any>> =
  ResultItem.Infer<InferResultType<TGroqBuilder>>;
