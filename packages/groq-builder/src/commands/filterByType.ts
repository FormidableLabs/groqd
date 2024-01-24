import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ExtractTypeNames } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filterByType<TType extends ExtractTypeNames<ResultItem.Infer<TResult>>>(
      ...type: TType[]
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        Extract<ResultItem.Infer<TResult>, { _type: TType }>
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
