import { GroqBuilder } from "../groq-builder";
import { ExtractDocumentTypes } from "../types/document-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Overrides the result type to anything you specify.
     *
     * Use this carefully, since it's essentially "lying" to TypeScript, and there's no runtime validation.
     *
     * @example
     * q.star.filter("slug.current == $productSlug").as<Product>()...
     *
     */
    as<TResultNew>(): GroqBuilder<TResultNew, TQueryConfig>;

    /**
     * Overrides the result type to a specific document type.
     *
     * Use this carefully, since it's essentially "lying" to TypeScript, and there's no runtime validation.
     *
     * @example
     * q.star.filter("slug.current == $productSlug").asType<"product">()...
     */
    asType<
      _type extends ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
    >(): GroqBuilder<
      Extract<TQueryConfig["schemaTypes"], { _type: _type }>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  as(this: GroqBuilder) {
    return this;
  },
  asType(this: GroqBuilder<never>) {
    return this;
  },
});
