import { createGroqBuilder } from "groq-builder";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./pokemon.sanity.types";

export const q = createGroqBuilder<{
  documentTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
}>({});
