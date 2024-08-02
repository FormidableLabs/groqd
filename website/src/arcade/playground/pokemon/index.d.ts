import type { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./pokemon.sanity.types";
export declare const q: import("groq-builder").GroqBuilder<import("groq-builder/dist/types/utils").Empty, Omit<{
    documentTypes: AllSanitySchemaTypes;
    referenceSymbol: typeof internalGroqTypeReferenceTo;
}, "documentTypes"> & {
    documentTypes: AllSanitySchemaTypes;
}>;
