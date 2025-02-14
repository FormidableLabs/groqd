import { GroqBuilderRoot } from "../../groq-builder";
import { SchemaDocument } from "../../types/document-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderRoot<TResult, TQueryConfig> {
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

GroqBuilderRoot.implementProperties({
  star: {
    get(this: GroqBuilderRoot) {
      return this.chain("*");
    },
  },
});
