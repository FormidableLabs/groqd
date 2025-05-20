import {
  GroqBuilder,
  GroqBuilderBase,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../groq-builder";
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
    ReturnType extends "root" | "subquery" | "chain"
  > {
    /**
     * Overrides the result type to anything you specify.
     *
     * Use this carefully, since it's essentially "lying" to TypeScript, and there's no runtime validation.
     *
     * @example
     * q.star.filterBy("slug.current == $productSlug").as<Product>()...
     *
     */
    as<TResultNew>(): GroqBuilderOfType<TResultNew, TQueryConfig, ReturnType>;

    /**
     * Overrides the result type to a specific document type.
     *
     * Use this carefully, since it's essentially "lying" to TypeScript, and there's no runtime validation.
     *
     * @example
     * q.star.filterBy("slug.current == $productSlug").asType<"product">()...
     */
    asType<
      _type extends ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
    >(): GroqBuilderOfType<
      Extract<TQueryConfig["schemaTypes"], { _type: _type }>,
      TQueryConfig,
      ReturnType
    >;
  }
}

export type GroqBuilderOfType<
  TResult,
  TQueryConfig extends QueryConfig,
  ReturnType extends "root" | "subquery" | "chain"
> = ReturnType extends "root"
  ? GroqBuilderRoot<TResult, TQueryConfig>
  : ReturnType extends "subquery"
  ? GroqBuilderSubquery<TResult, TQueryConfig>
  : GroqBuilder<TResult, TQueryConfig>;

GroqBuilderBase.implement({
  as(this: GroqBuilderBase) {
    return this;
  },
  asType(this: GroqBuilderBase) {
    return this;
  },
});
