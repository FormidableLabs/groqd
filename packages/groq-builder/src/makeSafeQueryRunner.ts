import type { HasRequiredKeys, IsUnknown } from "type-fest";
import type { QueryConfig } from "./types/schema-types";

import { IGroqBuilder } from "./types/public-types";

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
 * Utility to create a "query runner" that consumes the result of the `q` chain.
 */
export function makeSafeQueryRunner<TCustomOptions>(
  fn: (
    query: string,
    options: QueryRunnerOptions & TCustomOptions
  ) => Promise<any>
) {
  return async function queryRunner<
    TResult,
    TQueryConfig extends QueryConfig,
    /** Type alias (local use only): */
    _TOptions extends QueryRunnerOptions<TQueryConfig> &
      TCustomOptions = QueryRunnerOptions<TQueryConfig> & TCustomOptions
  >(
    builder: IGroqBuilder<TResult, TQueryConfig>,
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
