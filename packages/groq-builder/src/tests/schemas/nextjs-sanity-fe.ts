import {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./nextjs-sanity-fe.sanity-typegen";
import * as SanitySchema from "./nextjs-sanity-fe.sanity-typegen";

export { SanitySchema };

export type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export type ContentBlock = SanitySchema.Description[number];
