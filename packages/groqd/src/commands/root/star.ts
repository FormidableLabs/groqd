import {
  GroqBuilder,
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { SchemaDocument } from "../../types/document-types";
import { QueryConfig } from "../../types/query-config";

declare module "../../groq-builder" {
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends StarDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends StarDefinition<TResult, TQueryConfig> {}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StarDefinition<TResult, TQueryConfig extends QueryConfig> {
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
const starImplementation = {
  star: {
    get(this: GroqBuilderBase) {
      return this.chain("*");
    },
  },
};
GroqBuilderRoot.implementProperties(starImplementation);
GroqBuilderSubquery.implementProperties(starImplementation);
