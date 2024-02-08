import { GroqBuilder } from "../groq-builder";
import { ProjectionMap } from "./projection-types";
import { Fragment } from "../types/public-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
    fragment<TFragmentInput>(): {
      project<TProjectionMap extends ProjectionMap<TFragmentInput>>(
        projectionMap:
          | TProjectionMap
          | ((q: GroqBuilder<TFragmentInput, TQueryConfig>) => TProjectionMap)
      ): Fragment<TProjectionMap, TFragmentInput>;
    };
  }
}

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
