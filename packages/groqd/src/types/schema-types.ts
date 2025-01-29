import { TypeMismatchError } from "./type-mismatch-error";

export type QueryConfig = {
  /**
   * This is a union of all possible document types,
   * coming from your Sanity-generated types.
   */
  schemaTypes: {};

  /**
   * This symbol is exported by the generated Sanity types.
   * It's used to extract document types from a reference object.
   */
  referenceSymbol: symbol;

  /**
   * Represents a map of input parameter names, and their types.
   * To set this, use the `q.parameters<{ id: string }>()` syntax
   */
  parameters?: {}; // eslint-disable-line @typescript-eslint/ban-types
};

export type SchemaDocument = { _type: string };

export type ExtractDocumentTypes<TResultItem> = Extract<
  TResultItem,
  SchemaDocument
>["_type"];

export type RefType<referenceSymbol extends symbol, TTypeName> = {
  [P in referenceSymbol]?: TTypeName;
};

export type ExtractRefType<TResultItem, TQueryConfig extends QueryConfig> =
  //
  TResultItem extends RefType<TQueryConfig["referenceSymbol"], infer TTypeName>
    ? Extract<TQueryConfig["schemaTypes"], { _type: TTypeName }>
    : TypeMismatchError<{
        error: "⛔️ Expected the object to be a reference type ⛔️";
        expected: RefType<
          TQueryConfig["referenceSymbol"],
          ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
        >;
        actual: TResultItem;
      }>;
