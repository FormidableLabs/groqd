import type { RootConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions } from "./groq-builder";

import "./commands";

// Export all our public types:
export * from "./types/public-types";
export * from "./types/schema-types";
export { GroqBuilder, GroqBuilderOptions } from "./groq-builder";

type RootResult = never;

export function createGroqBuilder<TRootConfig extends RootConfig>(
  options: GroqBuilderOptions = { indent: "" }
) {
  return new GroqBuilder<RootResult, TRootConfig>({
    query: "",
    parser: null,
    options,
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

/**
 * Excludes the first item in a tuple
 */
type ButFirst<T extends Array<any>> = T extends [any, ...infer Rest]
  ? Rest
  : never;
