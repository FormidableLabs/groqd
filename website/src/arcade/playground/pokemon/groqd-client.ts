import { createGroqBuilderWithZod, makeSafeQueryRunner } from "groqd";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./pokemon.sanity.types";

type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilderWithZod<SchemaConfig>({
  indent: "  ",
});

/** This method will be overridden by the arcade, it is only here for the types. */
export const runQuery = makeSafeQueryRunner(() => null);
