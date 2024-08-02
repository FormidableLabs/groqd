import {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./nextjs-sanity-fe.sanity-typegen";
import * as SanitySchema from "./nextjs-sanity-fe.sanity-typegen";
import { ExtractDocumentTypes } from "../../types/schema-types";

export { SanitySchema };

export type SchemaConfig = {
  documentTypes: ExtractDocumentTypes<AllSanitySchemaTypes>;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export type ContentBlock = SanitySchema.Description[number];
