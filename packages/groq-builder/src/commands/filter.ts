import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";
import { ConditionalExpression } from "./conditional-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filter(
      filterExpression: ConditionalExpression<TResult>
    ): GroqBuilder<TResult, TRootConfig>;
  }
}

GroqBuilder.implement({
  filter(this: GroqBuilder<any, RootConfig>, filterExpression) {
    return this.chain(`[${filterExpression}]`, null);
  },
});
