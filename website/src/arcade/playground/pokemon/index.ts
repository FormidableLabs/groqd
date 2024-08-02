import { createGroqBuilder, ExtractDocumentTypes } from "groq-builder";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./pokemon.sanity.types";

type SchemaConfig = {
  documentTypes: ExtractDocumentTypes<AllSanitySchemaTypes>;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<SchemaConfig>({});
