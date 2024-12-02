import { GroqBuilder } from "../groq-builder";
import { SchemaDocument } from "../types/schema-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    star: GroqBuilder<
      Array<Extract<TQueryConfig["schemaTypes"], SchemaDocument>>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implementProperties({
  star: {
    get(this: GroqBuilder) {
      return this.chain("*");
    },
  },
});
