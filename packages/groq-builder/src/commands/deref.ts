import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    deref(): GroqBuilder<
      TResult extends Array<infer TResultItem>
        ? Array<ExtractRefType<TResultItem, TRootConfig>>
        : ExtractRefType<TResult, TRootConfig>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>): any {
    return this.chain("->", null);
  },
});
