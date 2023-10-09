import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../utils/type-utils";

import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    slice(index: number): GroqBuilder<ArrayItem<TScope>, TRootConfig>;
    slice(
      range: `${number}${Ellipsis}${number}`
    ): GroqBuilder<TScope, TRootConfig>;

    /** @deprecated Indexing is done via the 'slice' method */
    index: never;
  }
  type Ellipsis =
    /** Inclusive range */
    | ".."
    /** Exclusive range */
    | "...";
}
GroqBuilder.implement({
  slice(this: GroqBuilder<any, any>, indexOrRange) {
    return this.extend(`[${indexOrRange}]`, null);
  },
});
