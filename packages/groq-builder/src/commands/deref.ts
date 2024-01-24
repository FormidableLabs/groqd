import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    deref<
      TReferencedType = ExtractRefType<ResultItem.Infer<TResult>, TRootConfig>
    >(): GroqBuilder<
      ResultItem.Override<TResult, TReferencedType>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>) {
    return this.chain("->", null);
  },
});
