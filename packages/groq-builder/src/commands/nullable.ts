import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    nullable(): GroqBuilder<TResult | null, TRootConfig>;
  }
}

GroqBuilder.implement({
  nullable(this: GroqBuilder<any, RootConfig>) {
    const parser = this.parser;

    if (!parser) {
      // If there's no previous parser, then this method is just used
      // for type-safety, and we don't need to perform runtime validation:
      return this;
    }
    return this.chain("", (input) => {
      return input === null ? null : parser(input);
    });
  },
});
