import { GroqBuilder } from "../groq-builder";
import { ResultItem, ResultOverride } from "../types/result-types";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     * @param fieldName
     */
    projectField<TProjectionKey extends ProjectionKey<ResultItem<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultOverride<
        TResult,
        ProjectionKeyValue<ResultItem<TResult>, TProjectionKey>
      >,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  projectField(this: GroqBuilder, fieldName: string) {
    if (this.internal.query) {
      fieldName = "." + fieldName;
    }
    return this.chain<any>(fieldName, null);
  },
});
