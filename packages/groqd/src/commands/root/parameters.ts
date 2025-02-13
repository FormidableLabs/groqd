import { GroqBuilder } from "../../groq-builder";
import { Override } from "../../types/utils";
import { Simplify } from "type-fest";
import { ParametersWith$Sign } from "../../types/parameter-types";
import { QueryConfig } from "../../types/query-config";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends ParametersDefinition<TResult, TQueryConfig, "root"> {}
  export interface GroqBuilderChain<TResult, TQueryConfig>
    extends ParametersDefinition<TResult, TQueryConfig, "chain"> {}

  interface ParametersDefinition<
    TResult,
    TQueryConfig extends QueryConfig,
    ReturnType extends "root" | "chain"
  > {
    /**
     * Defines the names and types of parameters that
     * must be passed to the query.
     *
     * This method is just for defining types;
     * it has no runtime effects.
     *
     * The parameter types should not include the `$` prefix.
     *
     * @example
     * const productsBySlug = (
     *   q.parameters<{ slug: string }>()
     *    .star
     *    .filterByType('product')
     *    // You can now reference the $slug parameter:
     *    .filterBy('slug.current == $slug')
     * );
     * const results = await executeQuery(
     *   productsBySlug,
     *   // The 'slug' parameter is required:
     *   { parameters: { slug: "123" } }
     * )
     */
    parameters<TParameters>(): Override<
      TQueryConfig,
      {
        // Merge existing parameters with the new parameters:
        parameters: Simplify<TQueryConfig["parameters"] & TParameters>;
        // Add all these parameters to the scope:
        scope: Simplify<
          TQueryConfig["scope"] & ParametersWith$Sign<TParameters>
        >;
      }
    > extends infer _NewQueryConfig extends QueryConfig
      ? ReturnType extends "root"
        ? GroqBuilderRoot<TResult, _NewQueryConfig>
        : GroqBuilderChain<TResult, _NewQueryConfig>
      : never;

    /** @deprecated Use `parameters` to define parameters */
    variables: never;
  }
}

GroqBuilder.implement({
  parameters(this: GroqBuilder) {
    // This method is used just for chaining types
    return this as any;
  },
});
