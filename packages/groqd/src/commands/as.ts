import { GroqBuilderCore } from "../groq-builder";
import { ExtractDocumentTypes } from "../types/document-types";
import { QueryConfig } from "../types/query-config";

declare module "../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends AsDefinitions<TResult, TQueryConfig, "root"> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends AsDefinitions<TResult, TQueryConfig, "subquery"> {}
  export interface GroqBuilder<TResult, TQueryConfig>
    extends AsDefinitions<TResult, TQueryConfig, "chain"> {}

  export interface AsDefinitions<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TResult,
    TQueryConfig extends QueryConfig,
    source extends "root" | "subquery" | "chain"
  > {
    /**
     * Overrides the result type to anything you specify.
     *
     * Use this carefully, since it's essentially "lying" to TypeScript, and there's no runtime validation.
     *
     * @example
     * q.star.filter("slug.current == $productSlug").as<Product>()...
     *
     */
    as<TResultNew>(): source extends "root"
      ? GroqBuilderRoot<TResultNew, TQueryConfig>
      : source extends "subquery"
      ? GroqBuilderSubquery<TResultNew, TQueryConfig>
      : GroqBuilder<TResultNew, TQueryConfig>;

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
    >(): Extract<
      TQueryConfig["schemaTypes"],
      { _type: _type }
    > extends infer TResultNew
      ? source extends "root"
        ? GroqBuilderRoot<TResultNew, TQueryConfig>
        : source extends "subquery"
        ? GroqBuilderSubquery<TResultNew, TQueryConfig>
        : GroqBuilder<TResultNew, TQueryConfig>
      : never;
  }
}

GroqBuilderCore.implement({
  as(this: GroqBuilderCore) {
    return this;
  },
  asType(this: GroqBuilderCore) {
    return this;
  },
});
