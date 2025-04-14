import { ParametersWith$Sign } from "./parameter-types";
import { Override, Simplify } from "./utils";

/* eslint-disable @typescript-eslint/ban-types */

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
  parameters?: {};

  /**
   * Represents all variables that are currently in-scope.
   *
   * This might include:
   * - Results of the `score()` function (`_score`)
   * - Parent selector (`^`)
   * - All parameters (`$id` or `$slug`)
   */
  scope?: {};
};

export type ConfigAddScope<
  TNewScope,
  TQueryConfig extends QueryConfig
> = Override<
  TQueryConfig,
  { scope: Simplify<Override<TQueryConfig["scope"], TNewScope>> }
>;
export type ConfigAddParameters<
  TQueryConfig extends QueryConfig,
  TNewParameters
> = Override<
  TQueryConfig,
  {
    parameters: Simplify<Override<TQueryConfig["parameters"], TNewParameters>>;
    scope: Simplify<
      Override<TQueryConfig["scope"], ParametersWith$Sign<TNewParameters>>
    >;
  }
>;

export type ScopeWithCurrent<TCurrent = unknown> = { "@": TCurrent };
export type ScopeWithParent<TParent> = { "^": TParent };

/**
 * Creates a new nested scope, with a current value ("@"),
 * and existing current ("@") gets hoisted to parent ("^")
 */
export type ConfigCreateNestedScope<
  TQueryConfig extends QueryConfig,
  TCurrent
> = ConfigAddScope<
  TQueryConfig["scope"] extends ScopeWithCurrent<infer TPrevCurrent>
    ? ScopeWithCurrent<TCurrent> & ScopeWithParent<TPrevCurrent>
    : ScopeWithCurrent<TCurrent>,
  TQueryConfig
>;
