import { GroqBuilder } from "../groq-builder";
import { Override } from "../types/utils";
import { Simplify } from "type-fest";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    variables<TVariables>(): GroqBuilder<
      TResult,
      Override<
        TQueryConfig,
        {
          // Merge existing variables with the new variables:
          variables: Simplify<TQueryConfig["variables"] & TVariables>;
        }
      >
    >;
  }
}

GroqBuilder.implement({
  variables(this: GroqBuilder) {
    // This method is used just for chaining types
    return this as any;
  },
});
