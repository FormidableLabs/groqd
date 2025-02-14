import { GroqBuilderRoot } from "../groq-builder";
import { QueryConfig } from "../types/query-config";

/**
 * Returns a subquery for testing
 */
export function getSubquery<TResult, TQueryConfig extends QueryConfig>(
  q: GroqBuilderRoot<TResult, TQueryConfig>
) {
  // @ts-expect-error q.subquery is protected, but for tests we can use it:
  const child = q.subquery;
  return child;
}
