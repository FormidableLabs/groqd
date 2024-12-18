import { GroqBuilder } from "../groq-builder";
import { SchemaDocument } from "../types/schema-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Selects all documents, via GROQ's `*` selector.
     * This is how most queries start.
     *
     * @example
     * q.star.filter(...).project(...)
     *
     */
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
