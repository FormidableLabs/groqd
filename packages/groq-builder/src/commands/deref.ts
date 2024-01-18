import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../types/schema-types";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    deref<
      TReferencedType = ExtractRefType<ResultItem<TResult>, TRootConfig>
    >(): GroqBuilder<ResultOverride<TResult, TReferencedType>, TRootConfig>;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>) {
    return this.chain("->", null);
  },
});
