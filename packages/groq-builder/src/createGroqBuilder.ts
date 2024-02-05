import type { RootQueryConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";

/**
 * Creates the root `q` query builder.
 *
 * Does not include runtime validation methods like `q.string()`.
 * Instead, you have 3 options:
 * - You can import `zod` and use `zod.string()` instead of `q.string()`
 * - You can use inferred types without runtime validation
 * - You can provide your own validation methods
 * The Zod dependency can be tree-shaken with the latter 2 approaches.
 *
 * The TRootConfig type argument is used to bind the query builder to the Sanity schema config.
 * If you specify `any`, then your schema will be loosely-typed, but the output types will still be strongly typed.
 */
export function createGroqBuilder<TRootConfig extends RootQueryConfig>(
  options: GroqBuilderOptions = {}
) {
  const q = new GroqBuilder<RootResult, TRootConfig>({
    query: "",
    parser: null,
    options,
  });
  return q;
}
