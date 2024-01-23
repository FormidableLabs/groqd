import { GroqBuilder } from "../../groq-builder";

/**
 * Marks a field where we want to infer the type,
 * and also where we don't want to perform client-side validation
 * @internal
 */
export const inferSymbol = Symbol("inferred");
export type inferSymbol = typeof inferSymbol;

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Infers the result type from the schema.
     *
     * Performs no client-side validation,
     * allowing the results to pass through.
     *
     * Be sure to only use this when you
     * trust that your data matches your schema.
     */
    infer(): typeof inferSymbol;
  }
}

GroqBuilder.implement({
  infer(): typeof inferSymbol {
    return inferSymbol;
  },
});
