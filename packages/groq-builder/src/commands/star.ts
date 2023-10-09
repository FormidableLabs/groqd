import { GroqBuilder } from "../groq-builder";
import { ExtractDocumentTypes, RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    star: GroqBuilder<ExtractDocumentTypes<TRootConfig>, TRootConfig>;
  }
}

GroqBuilder.implementProperties({
  star: {
    get(this: GroqBuilder<any, any>) {
      return this.extend("*", null);
    },
  },
});
