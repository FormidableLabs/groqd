import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";
import { ConditionalExpression } from "./conditional-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    filter(
      filterExpression: ConditionalExpression<TResult>
    ): GroqBuilder<TResult, TQueryConfig>;
  }
}

GroqBuilder.implement({
  filter(this: GroqBuilder<any, QueryConfig>, filterExpression) {
    return this.chain(`[${filterExpression}]`);
  },
});
