import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../types/utils";
import { StringKeys } from "../types/common-types";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    order<TKeys extends StringKeys<keyof ArrayItem<TResult>>>(
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
