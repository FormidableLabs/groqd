import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    star: GroqBuilder<Array<TRootConfig["documentTypes"]>, TRootConfig>;
  }
}

GroqBuilder.implementProperties({
  star: {
    get(this: GroqBuilder) {
      return this.chain("*", null);
    },
  },
});
