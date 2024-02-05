import { GroqBuilder } from "../groq-builder";
import { QueryConfig } from "../types/schema-types";
import { Expressions } from "../types/groq-expressions";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    filter(
      filterExpression: Expressions.AnyConditional<TResult, TQueryConfig>
    ): GroqBuilder<TResult, TQueryConfig>;
  }
}

GroqBuilder.implement({
  filter(this: GroqBuilder<any, QueryConfig>, filterExpression) {
    return this.chain(`[${filterExpression}]`);
  },
});
