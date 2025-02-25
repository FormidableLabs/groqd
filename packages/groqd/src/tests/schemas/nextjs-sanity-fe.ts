import {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./nextjs-sanity-fe.sanity-typegen";
import * as SanitySchema from "./nextjs-sanity-fe.sanity-typegen";
import { createGroqBuilderWithZod, z } from "../../index";

export { SanitySchema, z };

export type ReferenceTo<TypeName extends string> = {
  _ref: string;
  _type: "reference";
  _weak?: boolean;
  [internalGroqTypeReferenceTo]?: TypeName;
};

export type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export type ContentBlock = SanitySchema.Description[number];

export const q = createGroqBuilderWithZod<SchemaConfig>({ indent: "  " });
