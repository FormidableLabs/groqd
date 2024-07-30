// Be sure to keep these first 2 imports in this order:
import "./groq-builder";
import "./commands";

import type { QueryConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
import { zod } from "./validation/zod";
import type { Override } from "./types/utils";

// Re-export all our public types:
export * from "./groq-builder";
export * from "./types/public-types";
export * from "./types/schema-types";
export { zod } from "./validation/zod";
export { makeSafeQueryRunner } from "./makeSafeQueryRunner";

export type RootQueryConfig = Override<
  QueryConfig,
  {
    /**
     * This is a union of all possible document types,
     * according to your Sanity config.
     *
     * You can automatically generate these types using the
     * `sanity typegen generate` command in your Sanity Studio project.
     *
     * Alternatively, you can use `any`, which disables schema-awareness,
     * but still allows strongly-typed query results.
     */
    documentTypes: object; // We'll filter out non-documents later
  }
>;
type ExtractQueryConfig<TRootConfig extends RootQueryConfig> =
  // Filter out all non-documents:
  Override<
    TRootConfig,
    { documentTypes: Extract<TRootConfig["documentTypes"], { _type: string }> }
  >;

/**
 * Creates the root `q` query builder.
 *
 * This method does not include the `zod` utilities
 * for runtime validation, like `q.string()`;
 * see `createGroqBuilderWithZod` for more information.
 *
 * @example
 * import { createGroqBuilder } from 'groq-builder';
 * import {
 *   AllSanitySchemaTypes,
 *   internalGroqTypeReferenceTo,
 * } from "./sanity.types.ts";
 *
 * export const q = createGroqBuilder<{
 *   documentTypes: AllSanitySchemaTypes,
 *   referenceSymbol: typeof internalGroqTypeReferenceTo;
 * }>();
 */
export function createGroqBuilder<TRootConfig extends RootQueryConfig>(
  options: GroqBuilderOptions = {}
) {
  type TQueryConfig = ExtractQueryConfig<TRootConfig>;
  const q = new GroqBuilder<RootResult, TQueryConfig>({
    query: "",
    parser: null,
    options,
  });
  return q;
}

/**
 * Creates the root `q` query builder.
 *
 * For convenience, includes all Zod validation methods attached to the `q` object, like `q.string()` etc.
 * This ensures an API that's backwards compatible with GroqD syntax.
 *
 * If you want to use `zod` directly,
 * or a different validation library,
 * or don't need runtime validation,
 * use `createGroqBuilder` instead.
 *
 * @example
 * import { createGroqBuilderWithZod } from 'groq-builder';
 * import {
 *   AllSanitySchemaTypes,
 *   internalGroqTypeReferenceTo,
 * } from "./sanity.types.ts";
 *
 * export const q = createGroqBuilderWithZod<{
 *   documentTypes: AllSanitySchemaTypes,
 *   referenceSymbol: typeof internalGroqTypeReferenceTo;
 * }>();
 */
export function createGroqBuilderWithZod<TRootConfig extends RootQueryConfig>(
  options: GroqBuilderOptions = {}
) {
  const q = createGroqBuilder<TRootConfig>(options);
  return Object.assign(q, zod);
}
