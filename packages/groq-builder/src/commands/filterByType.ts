import { GroqBuilder } from "../groq-builder";
import { ResultItem, ResultOverride } from "../types/result-types";
import { ExtractTypeNames } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filterByType<TType extends ExtractTypeNames<ResultItem<TResult>>>(
      ...type: TType[]
    ): GroqBuilder<
      ResultOverride<TResult, Extract<ResultItem<TResult>, { _type: TType }>>,
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
