// Be sure to keep these 2 imports in the correct order:
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
import "./commands";

import type { RootConfig } from "./types/schema-types";
import type { ButFirst } from "./types/utils";
import { zod } from "./validation/zod";

// Re-export all our public types:
export * from "./types/public-types";
export * from "./types/schema-types";
export { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
export { zod } from "./validation/zod";

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
export function createGroqBuilder<TRootConfig extends RootConfig>(
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
export function createGroqBuilderWithZod<TRootConfig extends RootConfig>(
  options: GroqBuilderOptions = {}
) {
  const q = createGroqBuilder<TRootConfig>(options);
  return Object.assign(q, zod);
}

/**
 * Utility to create a "query runner" that consumes the result of the `q` function.
 */
export function makeSafeQueryRunner<
  FunnerFn extends (query: string, ...parameters: any[]) => Promise<any>
>(fn: FunnerFn) {
  return async function queryRunner<TResult>(
    builder: GroqBuilder<TResult>,
    ...parameters: ButFirst<Parameters<FunnerFn>>
  ): Promise<TResult> {
    const data = await fn(builder.query, ...parameters);

    const parsed = builder.parse(data);
    return parsed;
  };
}
