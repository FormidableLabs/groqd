import { TypeMismatchError } from "./utils";

export type RootQueryConfig = {
  /**
   * This should be a union of all possible document types, according to your Sanity config.
   *
   * You can infer these values directly from your config using the @sanity-typed/types package,
   * or you can manually specify the types.
   *
   * @example
   * import config from "./sanity.config.ts";
   * import { InferSchemaConfigValues, referenced } from "@sanity-typed/types";
   * import { ExtractDocumentTypes } from "groq-builder";
   *
   * type InferredSchema = InferSchemaConfigValues<typeof config>;
   * export type SanityConfig = {
   *   documentTypes: ExtractDocumentTypes<InferredSchema>;
   *   referenceSymbol: typeof referenced;
   * }
   */
  documentTypes: { _type: string };
  /**
   * This symbol is exported by @sanity-typed/types
   * It's used to extract document types from a reference object.
   */
  referenceSymbol: symbol;
};

export type QueryConfig = RootQueryConfig & {
  /**
   * Represents a map of input parameter names, and their types.
   * To set this, use the `q.parameters<{ id: string }>()` syntax
   */
  parameters?: {};
};

/**
 * Extracts all document types from an inferred schema.
 * The inferred schema type should look like { [string]: Document }
 */
export type ExtractDocumentTypes<TInferredSchemaConfigValues> = Extract<
  TInferredSchemaConfigValues[keyof TInferredSchemaConfigValues],
  { _type: string }
>;

export type ExtractTypeNames<TResultItem> = Extract<
  TResultItem,
  { _type: string }
>["_type"];

export type RefType<referenceSymbol extends symbol, TTypeName> = {
  [P in referenceSymbol]: TTypeName;
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
