import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ExtractDocumentTypes } from "../types/document-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Filters the query based on the document type.
     * Supports multiple type arguments.
     *
     * @example
     * q.star.filterByType("pokemon");
     * // Result GROQ: *[_type == 'pokemon']
     * // Result Type: Pokemon[]
     */
    filterByType<TType extends ExtractDocumentTypes<ResultItem.Infer<TResult>>>(
      ...type: TType[]
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        Extract<ResultItem.Infer<TResult>, { _type: TType }>
      >,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  filterByType(this: GroqBuilder, ...type) {
    return this.chain(`[${type.map((t) => `_type == "${t}"`).join(" || ")}]`);
  },
});
