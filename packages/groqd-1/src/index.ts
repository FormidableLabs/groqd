// Be sure to keep these first 2 imports in this order:
import "./groq-builder";
import "./commands";

import type { QueryConfig } from "./types/schema-types";
import { GroqBuilder, GroqBuilderOptions, RootResult } from "./groq-builder";
import { ZodMethods, zodMethods } from "./validation/zod";

// Re-export all our public types:
export * from "./groq-builder";
export * from "./types/public-types";
export * from "./types/schema-types";
export { zodMethods as zod } from "./validation/zod";
export * from "./makeSafeQueryRunner";
export * from "./validation/validation-errors";

/**
 * Creates the root `q` query builder.
 *
 * This method does not include the `zod` utilities
 * for runtime validation, like `q.string()`;
 * see `createGroqBuilderWithZod` for more information.
 *
 * @example
 * import { createGroqBuilderLite, ExtractDocumentTypes } from 'groq-builder';
 * import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";
 *
 * type SchemaConfig = {
 *   schemaTypes: AllSanitySchemaTypes;
 *   referenceSymbol: typeof internalGroqTypeReferenceTo;
 * };
 * export const q = createGroqBuilderLite<SchemaConfig>();
 */
export function createGroqBuilderLite<TRootConfig extends QueryConfig>(
  options: GroqBuilderOptions = {}
): GroqBuilder<RootResult, TRootConfig> {
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
 * For convenience, includes all Zod validation methods attached to the `q` object, like `q.string()` etc.
 * This ensures an API that's backwards compatible with GroqD syntax.
 *
 * If you want to use `zod` directly,
 * or a different validation library,
 * or don't need runtime validation,
 * use `createGroqBuilderLite` instead.
 *
 * @example
 * import { createGroqBuilderWithZod, ExtractDocumentTypes } from 'groq-builder';
 * import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";
 *
 * type SchemaConfig = {
 *   schemaTypes: AllSanitySchemaTypes;
 *   referenceSymbol: typeof internalGroqTypeReferenceTo;
 * };
 * export const q = createGroqBuilderWithZod<SchemaConfig>(); */
export function createGroqBuilderWithZod<TRootConfig extends QueryConfig>(
  options: GroqBuilderOptions = {}
): GroqBuilderWithZod<TRootConfig> {
  const q = createGroqBuilderLite<TRootConfig>(options);
  return Object.assign(q, zodMethods);
}

export type GroqBuilderWithZod<TRootConfig extends QueryConfig> = ZodMethods &
  GroqBuilder<RootResult, TRootConfig>;
