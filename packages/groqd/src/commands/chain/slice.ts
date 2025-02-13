import { GroqBuilder } from "../../groq-builder";
import { ResultItem } from "../../types/result-types";

declare module "../../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Returns a single item from the results, based on the index.
     *
     * @example
     * q.star
     *  .filterByType("product")
     *  .slice(0)
     * // Result GROQ: *[_type == "product"][0]
     * // Result Type: Product
     *
     * @param index - Zero-based index to return
     */
    slice(
      index: number
    ): GroqBuilder<null | ResultItem.InferMaybe<TResult>, TQueryConfig>;

    /**
     * Returns a range of items from the results.
     */
    slice(
      /**
       * The first index to include in the slice
       */
      start: number,
      /**
       * The last index in the slice.
       * This item will not be included, unless 'inclusive' is set.
       */
      end: number,
      /**
       * Whether the 'end' item should be included (via the '..' operator).
       * @default false
       */
      inclusive?: boolean
    ): GroqBuilder<TResult, TQueryConfig>;

    /** @deprecated Use the 'slice' method */
    index: never;
    /** @deprecated Use the 'slice' method */
    range: never;
  }
}
GroqBuilder.implement({
  slice(this: GroqBuilder, start, end?, inclusive?): GroqBuilder<any> {
    if (typeof end === "number") {
      const ellipsis = inclusive ? ".." : "...";
      return this.pipe(`[${start}${ellipsis}${end}]`);
    }
    return this.chain(`[${start}]`);
  },
});
