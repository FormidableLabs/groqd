import type { IsUnknown, HasRequiredKeys } from "type-fest";
import type { QueryConfig } from "./types/schema-types";

import type { IGroqBuilder } from "./types/public-types";

export type QueryRunnerOptions<TQueryConfig extends QueryConfig = QueryConfig> =
  IsUnknown<TQueryConfig["parameters"]> extends true
    ? {
        /**
         * This query does not have any parameters defined.
         * Please use `q.parameters<...>()` to define the required input parameters.
         */
        parameters?: never;
      }
    : {
        /**
         * This query requires the following input parameters.
         */
        parameters: TQueryConfig["parameters"];
      };

/**
 * Executes a query and returns strongly-typed results.
 */
export type QueryRunnerFunction<TCustomOptions> = {
  <TResult, TQueryConfig extends QueryConfig>(
    builder: IGroqBuilder<TResult, TQueryConfig>,
    ..._options: MaybeRequired<
      QueryRunnerOptions<TQueryConfig> & TCustomOptions
    >
  ): Promise<TResult>;
};

/**
 * Utility to create a "query runner" that consumes the result of the `q` chain.
 *
 * If you need to pass custom options to your `execute` function,
 * use the TCustomOptions to ensure they're strongly typed.
 *
 * @example
 * const runner = makeSafeQueryRunner(
 *   async (query, { parameters }) => {
 *     return await sanityClient.fetch(query, { params: parameters });
 *   }
 * )
 *
 * @example
 * const runner = makeSafeQueryRunner<{ withAuth: boolean }>(
 *   async (query, { parameters, withAuth }) => {
 *     if (withAuth) ...
 *   }
 * )
 * */
export function makeSafeQueryRunner<TCustomOptions>(
  execute: (
    query: string,
    options: QueryRunnerOptions & TCustomOptions
  ) => Promise<any>
): QueryRunnerFunction<TCustomOptions> {
  return async function queryRunner(builder, ..._options) {
    const options: any = _options[0] || {};
    const results = await execute(builder.query, options);

    const parsed = builder.parse(results);
    return parsed;
  };
}

/**
 * If all options are fully optional,
 * then this makes the entire options argument optional too.
 *
 * If the options argument has any required keys,
 * then the entire options argument is required too.
 */
type MaybeRequired<TOptions extends object> =
  HasRequiredKeys<TOptions> extends true
    ? [TOptions] // Required
    : [] | [TOptions]; // Optional
