import { GroqBuilder } from "../groq-builder";
import { Override } from "../types/utils";
import { Simplify } from "type-fest";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
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
  }
}

GroqBuilder.implement({
  parameters(this: GroqBuilder) {
    // This method is used just for chaining types
    return this as any;
  },
});
