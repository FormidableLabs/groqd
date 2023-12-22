import { GroqBuilder } from "../groq-builder";
import { ExtractProjectionResult, ProjectionMap } from "./projection-types";
import { Simplify, Tagged } from "../types/utils";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    fragment<TFragmentInput>(): {
      project<TProjectionMap extends ProjectionMap<TFragmentInput>>(
        projectionMap:
          | TProjectionMap
          | ((q: GroqBuilder<TFragmentInput, TRootConfig>) => TProjectionMap)
      ): Fragment<TProjectionMap, TFragmentInput>;
    };
  }
}

export type Fragment<
  TProjectionMap,
  TFragmentInput // This is used to capture the type, to be extracted by `InferFragmentType`
> = Tagged<TProjectionMap, TFragmentInput>;

export type InferFragmentType<TFragment extends Fragment<any, any>> =
  TFragment extends Fragment<infer TProjectionMap, infer TFragmentInput>
    ? Simplify<ExtractProjectionResult<TFragmentInput, TProjectionMap>>
    : never;

GroqBuilder.implement({
  fragment(this: GroqBuilder<any>) {
    return {
      project: (projectionMap) => {
        if (typeof projectionMap === "function") {
          projectionMap = projectionMap(this);
        }
        return projectionMap;
      },
    };
  },
});
