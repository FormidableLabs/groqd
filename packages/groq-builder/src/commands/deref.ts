import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, QueryConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    deref<
      TReferencedType = ExtractRefType<ResultItem.Infer<TResult>, TQueryConfig>
    >(): GroqBuilder<
      ResultItem.Override<TResult, TReferencedType>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, QueryConfig>) {
    return this.chain("->");
  },
});
