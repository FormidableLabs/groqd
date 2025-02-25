import { createGroqBuilderWithZod, makeSafeQueryRunner } from "groqd";
import type * as SanityTypes from "./pokemon.sanity.types";

export { z } from "groqd";

type SchemaConfig = {
  schemaTypes: SanityTypes.AllSanitySchemaTypes;
  referenceSymbol: typeof SanityTypes.internalGroqTypeReferenceTo;
};

export const q = createGroqBuilderWithZod<SchemaConfig>({
  indent: "  ",
});

/**
 * Runs the query against the provided dataset,
 * and shows the results in the side panel.
 */
export const runQuery = makeSafeQueryRunner(() => null);
