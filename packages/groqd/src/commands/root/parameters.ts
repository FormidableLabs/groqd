import {
  GroqBuilder,
  GroqBuilderBase,
  GroqBuilderRoot,
} from "../../groq-builder";
import { Override } from "../../types/utils";
import { Simplify } from "type-fest";
import { ParametersWith$Sign } from "../../types/parameter-types";
import { QueryConfig } from "../../types/query-config";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends ParametersDefinition<TResult, TQueryConfig, "root"> {}
  export interface GroqBuilder<TResult, TQueryConfig>
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
    parameters<TParameters>(): Simplify<
      Override<
        TQueryConfig,
        {
          // Merge existing parameters with the new parameters:
          parameters: Simplify<TQueryConfig["parameters"] & TParameters>;
          // Add all these parameters to the scope:
          scope: Simplify<
            TQueryConfig["scope"] & ParametersWith$Sign<TParameters>
          >;
        }
      >
    > extends infer _NewQueryConfig extends QueryConfig
      ? ReturnType extends "root"
        ? GroqBuilderRoot<TResult, _NewQueryConfig>
        : GroqBuilder<TResult, _NewQueryConfig>
      : never;

    /** @deprecated Use `parameters` to define parameters */
    variables: never;
  }
}

const parametersImplementation: Pick<
  GroqBuilderRoot & GroqBuilder,
  "parameters"
> = {
  parameters(this: GroqBuilderBase) {
    // This method is used just for chaining types
    return this as any;
  },
};
GroqBuilderRoot.implement(parametersImplementation);
GroqBuilder.implement(parametersImplementation);
