import { GroqBuilder } from "../groq-builder";
import { DerefDeep } from "../types/ref-types";

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
    deref(): GroqBuilder<DerefDeep<TResult, TQueryConfig>, TQueryConfig>;
  }
}

GroqBuilder.implement({
  deref(this: GroqBuilder) {
    return this.chain("->");
  },
});
