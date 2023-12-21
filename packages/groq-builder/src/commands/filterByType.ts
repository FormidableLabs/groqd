import { GroqBuilder } from "../groq-builder";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filterByType<
      TType extends Extract<ResultItem<TResult>, { _type: string }>["_type"]
    >(
      type: TType
    ): GroqBuilder<
      ResultOverride<TResult, Extract<ResultItem<TResult>, { _type: TType }>>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  filterByType(this: GroqBuilder, type) {
    return this.chain(`[_type == "${type}"]`, null);
  },
});
