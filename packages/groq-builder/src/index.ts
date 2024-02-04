// Be sure to keep these 2 imports in the correct order:
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
import "./commands";

import type { QueryConfig, RootQueryConfig } from "./types/schema-types";
import { zod } from "./validation/zod";
import type { HasRequiredKeys, IsUnknown } from "type-fest";

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

export type QueryRunnerOptions<TQueryConfig extends QueryConfig = QueryConfig> =
  IsUnknown<TQueryConfig["variables"]> extends true
    ? {
        /**
         * This query does not have any variables defined.
         * Please use `q.variables<...>()` to define the required input variables.
         */
        variables?: never;
      }
    : {
        /**
         * This query requires the following input variables.
         */
        variables: TQueryConfig["variables"];
      };

/**
 * Utility to create a "query runner" that consumes the result of the `q` chain.
 */
export function makeSafeQueryRunner<TCustomParameters>(
  fn: (
    query: string,
    options: QueryRunnerOptions & TCustomParameters
  ) => Promise<any>
) {
  return async function queryRunner<
    TResult,
    TQueryConfig extends QueryConfig,
    _TOptions extends QueryRunnerOptions<TQueryConfig> &
      TCustomParameters = QueryRunnerOptions<TQueryConfig> & TCustomParameters
  >(
    builder: GroqBuilder<TResult, TQueryConfig>,
    // If the `options` argument doesn't have any required keys,
    // then make the argument optional:
    ..._options: HasRequiredKeys<_TOptions> extends true
      ? [_TOptions] // Required
      : [] | [_TOptions] // Optional
  ): Promise<TResult> {
    const options: any = _options[0] || {};
    const results = await fn(builder.query, options);

    const parsed = builder.parse(results);
    return parsed;
  };
}
