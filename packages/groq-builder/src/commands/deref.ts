import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    deref(): GroqBuilder<
      TScope extends Array<infer TScopeItem>
        ? Array<ExtractRefType<TScopeItem, TRootConfig>>
        : ExtractRefType<TScope, TRootConfig>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, RootConfig>): any {
    return this.chain("->", null);
  },
});
