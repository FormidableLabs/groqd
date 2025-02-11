import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { Expressions } from "../types/groq-expressions";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Orders the results by the keys specified
     */
    order<TFields extends Expressions.Order<ResultItem.Infer<TResult>>>(
      ...fields: Array<TFields>
    ): GroqBuilder<TResult, TQueryConfig>;

    /** @deprecated Sorting is done via the 'order' method */
    sort: never;
  }
}

GroqBuilder.implement({
  order(this: GroqBuilder, ...fields) {
    const query = ` | order(${fields.join(", ")})`;
    return this.pipe(query);
  },
});
