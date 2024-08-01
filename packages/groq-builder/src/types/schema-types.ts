import { TypeMismatchError } from "./utils";

export type QueryConfig = {
  /**
   * This is a union of all possible document types,
   * according to your Sanity config.
   */
  documentTypes: { _type: string };

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

export type ExtractTypeNames<TResultItem> = Extract<
  TResultItem,
  { _type: string }
>["_type"];

export type RefType<referenceSymbol extends symbol, TTypeName> = {
  [P in referenceSymbol]?: TTypeName;
};

export type ExtractRefType<TResultItem, TQueryConfig extends QueryConfig> =
  //
  TResultItem extends RefType<TQueryConfig["referenceSymbol"], infer TTypeName>
    ? Extract<TQueryConfig["documentTypes"], { _type: TTypeName }>
    : TypeMismatchError<{
        error: "⛔️ Expected the object to be a reference type ⛔️";
        expected: RefType<
          TQueryConfig["referenceSymbol"],
          TQueryConfig["documentTypes"]["_type"]
        >;
        actual: TResultItem;
      }>;
