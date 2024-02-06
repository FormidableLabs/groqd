// Be sure to keep these first 2 imports in this order:
import "./groq-builder";
import "./commands";

import type { RootQueryConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
import { zod } from "./validation/zod";

// Re-export all our public types:
export * from "./groq-builder";
export * from "./types/public-types";
export * from "./types/schema-types";
export { zod } from "./validation/zod";
export { makeSafeQueryRunner } from "./makeSafeQueryRunner";

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

/**
 * Creates the root `q` query builder.
 *
 * Includes all Zod validation methods attached to the `q` object,
 * like `q.string()` etc. This ensures an API that's backwards compatible with GroqD syntax.
 *
 * The TRootConfig type argument is used to bind the query builder to the Sanity schema config.
 * If you specify `any`, then your schema will be loosely-typed, but the output types will still be strongly typed.
 */
export function createGroqBuilderWithZod<TRootConfig extends RootQueryConfig>(
  options: GroqBuilderOptions = {}
) {
  const q = createGroqBuilder<TRootConfig>(options);
  return Object.assign(q, zod);
}
