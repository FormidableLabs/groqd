import { GroqBuilder } from "../groq-builder";
import { ExtractDocumentTypes, RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
