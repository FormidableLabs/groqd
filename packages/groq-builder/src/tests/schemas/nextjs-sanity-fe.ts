import {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./nextjs-sanity-fe.sanity-typegen";
import * as SanitySchema from "./nextjs-sanity-fe.sanity-typegen";

export type SchemaConfig = {
  documentTypes: Extract<AllSanitySchemaTypes, { _type: string }>;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export type ContentBlock = SanitySchema.Description[number];

export { SanitySchema };
