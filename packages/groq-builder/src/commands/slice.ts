import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../utils/type-utils";

import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    slice(index: number): GroqBuilder<ArrayItem<TScope>, TRootConfig>;
    slice(
      range: `${number}${SliceEllipsis}${number}`
    ): GroqBuilder<TScope, TRootConfig>;

    /** @deprecated Use the 'slice' method */
    index: never;
    /** @deprecated Use the 'slice' method */
    range: never;
  }
  export type SliceEllipsis =
    /** Inclusive range */
    | ".."
    /** Exclusive range */
    | "...";
}
GroqBuilder.implement({
  slice(this: GroqBuilder<any, any>, indexOrRange) {
    return this.chain(`[${indexOrRange}]`, null);
  },
});
