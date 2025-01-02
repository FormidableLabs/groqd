import { createGroqBuilderWithZod } from "groqd";
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
