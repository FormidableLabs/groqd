import {
  GroqBuilder,
  GroqBuilderBase,
  GroqBuilderSubquery,
} from "../groq-builder";
import { QueryConfig } from "../types/query-config";
import { ResultItem } from "../types/result-types";
import { Combine } from "../types/union-to-intersection";
import { GroqBuilderOfType } from "./as";

declare module "../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends AsCombinedDefinitions<TResult, TQueryConfig, "subquery"> {}
  export interface GroqBuilder<TResult, TQueryConfig>
    extends AsCombinedDefinitions<TResult, TQueryConfig, "chain"> {}
}
interface AsCombinedDefinitions<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TResult,
  TQueryConfig extends QueryConfig,
  ReturnType extends "root" | "subquery" | "chain"
> {
  /**
   * Normally, when your query matches multiple document types,
   * you can only project keys that all types have in common.
   *
   * This method combines all keys from the document types,
   * allowing you to project any of those keys.
   *
   * @example
   * q.star.filterByType("product", "category").asCombined().project({
   *   // Common fields:
   *   _type: true, // "product" | "category"
   *   name: true, // string
   *   slug: "slug.current", // string
   *
   *   // Product-only field:
   *   price: true, // number | null
   *
   *   // Category-only field:
   *   description: true, // string | null
   * });
   *
   */
  asCombined(): GroqBuilderOfType<
    ResultItem.Override<TResult, Combine<ResultItem.Infer<TResult>>>,
    TQueryConfig,
    ReturnType
  >;
}

const implementation = {
  asCombined<This extends GroqBuilderBase>(this: This) {
    return this;
  },
};

GroqBuilderSubquery.implement(implementation);
GroqBuilder.implement(implementation);
