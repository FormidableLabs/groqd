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
     *  .field("image.asset").deref().field("url")
     * // GROQ: *[_type == "product"].image.asset->url
     *
     * @example
     * q.star.filterByType("product").project(sub => ({
     *   category: sub.field("category").deref().field("title"),
     *   images: sub.field("images[]").field("asset").deref().project({
     *     url: q.string(),
     *     altText: q.string(),
     *   }),
     * }))
     * // GROQ: *[_type == "product"]{
     * //  "category": category->title,
     * //  "images": images[].asset->{ url, altText }
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
