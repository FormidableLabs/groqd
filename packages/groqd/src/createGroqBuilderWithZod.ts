import type { QueryConfig } from "./types/query-config";
import {
  GroqBuilderOptions,
  GroqBuilderRoot,
  RootResult,
} from "./groq-builder";
import { ZodMethods, zodMethods } from "./validation/zod";
import { createGroqBuilderLite } from "./createGroqBuilder";

export { zodMethods as z } from "./validation/zod";

/**
 * Creates the root `q` query builder.
 *
 * For convenience, includes all Zod validation methods attached to the `q` object, like `q.string()` etc.
 * This ensures an API that's backwards compatible with GroqD v0.x syntax.
 *
 * If you want to use `z` directly,
 * or a different validation library,
 * or don't need runtime validation,
 * use `createGroqBuilderLite` instead.
 *
 * @example
 * import { createGroqBuilderWithZod, ExtractDocumentTypes } from 'groqd';
 * import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";
 *
 * type SchemaConfig = {
 *   schemaTypes: AllSanitySchemaTypes;
 *   referenceSymbol: typeof internalGroqTypeReferenceTo;
 * };
 * export const q = createGroqBuilderWithZod<SchemaConfig>();
 */
export function createGroqBuilderWithZod<TRootConfig extends QueryConfig>(
  options: GroqBuilderOptions = {}
): GroqBuilderWithZod<TRootConfig> {
  const q = createGroqBuilderLite<TRootConfig>(options);
  return Object.assign(q, zodMethods);
}

export type GroqBuilderWithZod<TRootConfig extends QueryConfig> = ZodMethods &
  GroqBuilderRoot<RootResult, TRootConfig>;
