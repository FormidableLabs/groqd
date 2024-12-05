import { GroqBuilder } from "../groq-builder";
import { ExtractProjectionResult, ProjectionMap } from "./projection-types";
import { Fragment } from "../types/public-types";
import { ExtractDocumentTypes, QueryConfig } from "../types/schema-types";
import { RequireAFakeParameterIfThereAreTypeMismatchErrors } from "../types/utils";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    fragment<TFragmentInput>(): FragmentUtil<TQueryConfig, TFragmentInput>;

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
    TProjectionMap extends ProjectionMap<TFragmentInput>,
    _TProjectionResult = ExtractProjectionResult<TFragmentInput, TProjectionMap>
  >(
    projectionMap:
      | TProjectionMap
      | ((q: GroqBuilder<TFragmentInput, TQueryConfig>) => TProjectionMap),
    ...__projectionMapTypeMismatchErrors: RequireAFakeParameterIfThereAreTypeMismatchErrors<_TProjectionResult>
  ): Fragment<TProjectionMap, TFragmentInput>;
};

GroqBuilder.implement({
  fragment(this: GroqBuilder<any>): FragmentUtil<any, any> {
    return {
      project: (projectionMap, ...__projectionMapTypeMismatchErrors) => {
        if (typeof projectionMap === "function") {
          return projectionMap(this);
        }
        return projectionMap;
      },
    };
  },
  fragmentForType(this: GroqBuilder<any>): FragmentUtil<any, any> {
    return this.fragment();
  },
});
