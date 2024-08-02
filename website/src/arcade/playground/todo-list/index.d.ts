import { ExtractDocumentTypes } from "groq-builder";
import type { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./todo-list.sanity.types";
type SchemaConfig = {
    documentTypes: ExtractDocumentTypes<AllSanitySchemaTypes>;
    referenceSymbol: typeof internalGroqTypeReferenceTo;
};
export declare const q: import("groq-builder").GroqBuilder<import("groq-builder/dist/types/utils").Empty, SchemaConfig>;
export {};
