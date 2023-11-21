import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../types/utils";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    slice(
      index: number
    ): GroqBuilder<ArrayItem<NonNullable<TResult>>, TRootConfig>;
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
    ): GroqBuilder<TResult, TRootConfig>;

    /** @deprecated Use the 'slice' method */
    index: never;
    /** @deprecated Use the 'slice' method */
    range: never;
  }
}
GroqBuilder.implement({
  slice(this: GroqBuilder, start, end?, inclusive?): GroqBuilder {
    if (typeof end === "number") {
      const ellipsis = inclusive ? ".." : "...";
      return this.chain(`[${start}${ellipsis}${end}]`, null);
    }
    return this.chain(`[${start}]`, null);
  },
});
