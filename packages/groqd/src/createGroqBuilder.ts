import type { QueryConfig } from "./types/query-config";
import {
  GroqBuilderOptions,
  GroqBuilderRoot,
  RootResult,
} from "./groq-builder";

/**
 * Creates the root `q` query builder.
 *
 * This method does not include the `z` utilities
 * for runtime validation, like `q.string()`;
 * see `createGroqBuilderWithZod` for more information.
 *
 * @example
 * import { createGroqBuilderLite, ExtractDocumentTypes } from 'groqd';
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
) {
  const q = new GroqBuilderRoot<RootResult, TRootConfig>({
    query: "",
    parser: null,
    options,
  });
  return q;
}
