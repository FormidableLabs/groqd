import { GroqBuilderSubquery } from "../../groq-builder";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderSubquery<TResult, TQueryConfig> {
    /**
     * Inserts the self-operator "@".
     */
    self: GroqBuilder<TResult, TQueryConfig>;
  }
}

GroqBuilderSubquery.implementProperties({
  self: {
    get(this: GroqBuilderSubquery) {
      return this.chain("@");
    },
  },
});
