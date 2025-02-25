export type SchemaDocument = { _type: string };

/**
 * Extracts the `_type` field from all documents
 */
export type ExtractDocumentTypes<TResultItem> = Extract<
  TResultItem,
  SchemaDocument
>["_type"];
