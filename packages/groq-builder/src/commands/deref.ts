import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../types/schema-types";
import { InferResultItem, OverrideResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    deref<
      TReferencedType = ExtractRefType<InferResultItem<TResult>, TRootConfig>
    >(): GroqBuilder<OverrideResultItem<TResult, TReferencedType>, TRootConfig>;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>) {
    return this.chain("->", null);
  },
});
