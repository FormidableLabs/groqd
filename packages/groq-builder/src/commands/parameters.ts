import { GroqBuilder } from "../groq-builder";
import { Override } from "../types/utils";
import { Simplify } from "type-fest";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
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
    parameters<TParameters>(): GroqBuilder<
      TResult,
      Override<
        TQueryConfig,
        {
          // Merge existing parameters with the new parameters:
          parameters: Simplify<TQueryConfig["parameters"] & TParameters>;
        }
      >
    >;

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
