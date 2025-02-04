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
