import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../utils/type-utils";
import { StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

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
  order(this: GroqBuilder<any, any>, ...fields) {
    const query = ` | order(${fields.join(", ")})`;
    return this.chain(query, null);
  },
});
