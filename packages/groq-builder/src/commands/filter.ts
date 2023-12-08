import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filter(filterExpression: string): GroqBuilder<TResult, TRootConfig>;
  }
}

GroqBuilder.implement({
  filter(this: GroqBuilder<any, RootConfig>, filterExpression) {
    return this.chain(`[${filterExpression}]`, null);
  },
});
