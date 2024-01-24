import { GroqBuilder } from "../groq-builder";
import { StringKeys } from "../types/utils";
import { InferResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Orders the results by the keys specified
     */
    order<TKeys extends StringKeys<keyof InferResultItem<TResult>>>(
      ...fields: Array<`${TKeys}${"" | " asc" | " desc"}`>
    ): GroqBuilder<TResult, TRootConfig>;

    /** @deprecated Sorting is done via the 'order' method */
    sort: never;
  }
}

GroqBuilder.implement({
  order(this: GroqBuilder, ...fields) {
    const query = ` | order(${fields.join(", ")})`;
    return this.chain(query, null);
  },
});
