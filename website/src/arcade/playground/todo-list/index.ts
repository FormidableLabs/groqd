import { createGroqBuilderWithZod } from "groqd";
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from "./todo-list.sanity.types";

type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilderWithZod<SchemaConfig>({
  indent: "  ",
});
