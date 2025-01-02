import { GroqBuilder } from "../groq-builder";
import { ExtractRefType, QueryConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Uses GROQ's dereference operator (`->`) to follow a reference.
     *
     * @example
     * q.star
     *  .filterByType("product")
     *  .field("image").deref().field("url")
     * // GROQ: *[_type == "product"].image->url
     *
     * @example
     * q.star.filterByType("product").project(sub => ({
     *   category: sub.field("category").deref().field("title"),
     *   images: sub.field("images[]").deref().project({
     *     url: q.string(),
     *     width: q.number(),
     *     height: q.number(),
     *   }),
     * }))
     * // GROQ: *[_type == "product"]{
     * //  "category": category->title,
     * //  "images": images[]->{ url, width, height }
     * // }
     */
    deref<
      TReferencedType = ExtractRefType<ResultItem.Infer<TResult>, TQueryConfig>
    >(): GroqBuilder<
      ResultItem.Override<TResult, TReferencedType>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder<any, QueryConfig>) {
    return this.chain("->");
  },
});
