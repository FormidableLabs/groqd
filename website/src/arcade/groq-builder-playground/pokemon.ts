import type { createGroqBuilderWithZod } from "groq-builder";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./pokemon.sanity.types";

export const q = createGroqBuilderWithZod<{
  documentTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
}>({});
