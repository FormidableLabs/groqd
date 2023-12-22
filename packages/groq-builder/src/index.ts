// Be sure to keep these 2 imports in the correct order:
import { GroqBuilder, GroqBuilderOptions } from "./groq-builder";
import "./commands";

import type { RootConfig } from "./types/schema-types";
import type { ButFirst } from "./types/utils";

// Export all our public types:
export * from "./types/public-types";
export * from "./types/schema-types";
export { GroqBuilder, GroqBuilderOptions } from "./groq-builder";
export { validation } from "./validation";

type RootResult = never;

/**
 * Creates the root `q` query builder.
 *
 * The TRootConfig type argument is used to bind the query builder to the Sanity schema config.
 * If you specify `any`, then your schema will be loosely-typed, but the output types will still be strongly typed.
 *
 * @param options - Allows you to specify if you want indentation added to the final query. Useful for debugging.  Defaults to none.
 */
export function createGroqBuilder<TRootConfig extends RootConfig>(
  options: GroqBuilderOptions = { indent: "" }
) {
  const root = new GroqBuilder<RootResult, TRootConfig>({
    query: "",
    parser: null,
    options,
  });

  return Object.assign(root, {
    /**
     * Returns the root query object, extended with extra methods.
     * Useful for making validation utilities.
     *
     * @example
     * const q = createGroqBuilder().include(validation);
     *
     * // Now we have access to validation methods directly on `q`, like:
     * q.string()
     */
    include<TExtensions>(extensions: TExtensions) {
      return Object.assign(root, extensions);
    },
  });
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
