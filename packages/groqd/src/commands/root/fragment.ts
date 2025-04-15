import { GroqBuilderRoot, GroqBuilderSubquery } from "../../groq-builder";
import {
  ExtractProjectionResult,
  ProjectionMap,
} from "../../types/projection-types";
import { QueryConfig } from "../../types/query-config";
import { RequireAFakeParameterIfThereAreTypeMismatchErrors } from "../../types/type-mismatch-error";
import { ExtractDocumentTypes } from "../../types/document-types";
import { Simplify } from "type-fest";
import { Fragment } from "../../types/fragment-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderRoot<TResult, TQueryConfig> {
    /**
     * Creates a fragment for any type you specify.
     * This is useful for inline types that do not have a top-level document type.
     *
     * @example
     * const keyValueFragment = q.fragment<{ key: string, value: number }>().project({
     *   key: z.string(),
     *   value: z.number(),
     * })
     */
    fragment<TFragmentInput>(): FragmentUtil<TQueryConfig, TFragmentInput>;

    /**
     * Creates a fragment for a Document, based on the document type.
     *
     * @example
     * const productFragment = q.fragmentForType<"product">().project(sub => ({
     *   name: z.string(),
     *   price: z.number(),
     *   images: sub.field("images[]").field("asset").deref().project({
     *     url: z.string(),
     *     altText: z.string(),
     *   }),
     * }))
     */
    fragmentForType<
      TFragmentType extends ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
    >(): FragmentUtil<
      TQueryConfig,
      Extract<TQueryConfig["schemaTypes"], { _type: TFragmentType }>
    >;
  }
}

/**
 * When creating a Fragment, we return this utility object
 * that exposes a `project` method that has almost the same API
 * as the normal `project` method.
 */
export type FragmentUtil<TQueryConfig extends QueryConfig, TFragmentInput> = {
  /**
   * Performs an "object projection", returning an object with the fields specified.
   *
   * @param projectionMap - The projection map is an object, mapping field names to projection values
   * @param __projectionMapTypeMismatchErrors - (internal: this is only used for reporting errors from the projection)
   */
  project<
    TProjectionMap extends ProjectionMap<TFragmentInput, TQueryConfig>,
    _TProjectionResult = ExtractProjectionResult<
      TFragmentInput,
      TQueryConfig,
      TProjectionMap
    >
  >(
    projectionMap:
      | TProjectionMap
      | ((
          sub: GroqBuilderSubquery<TFragmentInput, TQueryConfig>
        ) => TProjectionMap),
    ...__projectionMapTypeMismatchErrors: RequireAFakeParameterIfThereAreTypeMismatchErrors<_TProjectionResult>
  ): Fragment<Simplify<_TProjectionResult>, TFragmentInput, TProjectionMap>;
};

GroqBuilderRoot.implement({
  fragment(this: GroqBuilderRoot): FragmentUtil<any, any> {
    return {
      project: (projectionMap, ...__projectionMapTypeMismatchErrors) => {
        if (typeof projectionMap === "function") {
          return projectionMap(this.subquery);
        }
        return projectionMap;
      },
    };
  },
  fragmentForType(this: GroqBuilderRoot): FragmentUtil<any, any> {
    return this.fragment();
  },
});
