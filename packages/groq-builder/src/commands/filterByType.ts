import { GroqBuilder } from "../groq-builder";
import { InferResultItem, OverrideResultItem } from "../types/result-types";
import { ExtractTypeNames } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filterByType<TType extends ExtractTypeNames<InferResultItem<TResult>>>(
      ...type: TType[]
    ): GroqBuilder<
      OverrideResultItem<
        TResult,
        Extract<InferResultItem<TResult>, { _type: TType }>
      >,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  filterByType(this: GroqBuilder, ...type) {
    return this.chain(
      `[${type.map((t) => `_type == "${t}"`).join(" || ")}]`,
      null
    );
  },
});
