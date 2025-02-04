export type SchemaDocument = { _type: string };

export type ExtractDocumentTypes<TResultItem> = Extract<
  TResultItem,
  SchemaDocument
>["_type"];
