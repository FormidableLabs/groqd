import {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./nextjs-sanity-fe.sanity-typegen";
import * as SanitySchema from "./nextjs-sanity-fe.sanity-typegen";
import { createGroqBuilderWithZod } from "../../index";

export { SanitySchema };

export type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export type ContentBlock = SanitySchema.Description[number];

export const q = createGroqBuilderWithZod<SchemaConfig>({ indent: "  " });
