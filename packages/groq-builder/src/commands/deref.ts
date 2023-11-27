import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../types/schema-types";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    deref(): GroqBuilder<
      ResultOverride<TResult, ExtractRefType<ResultItem<TResult>, TRootConfig>>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>): any {
    return this.chain("->", null);
  },
});
