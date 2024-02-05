import { GroqBuilder } from "../groq-builder";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    star: GroqBuilder<Array<TRootConfig["documentTypes"]>, TRootConfig>;
  }
}

GroqBuilder.implementProperties({
  star: {
    get(this: GroqBuilder) {
      return this.chain("*");
    },
  },
});
