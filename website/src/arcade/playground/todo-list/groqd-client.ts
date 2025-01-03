import { createGroqBuilderWithZod, makeSafeQueryRunner } from "groqd";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./todo-list.sanity.types";

type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilderWithZod<SchemaConfig>({
  indent: "  ",
});

/**
 * Runs the query against the provided dataset,
 * and shows the results in the side panel.
 */
export const runQuery = makeSafeQueryRunner(() => null);
