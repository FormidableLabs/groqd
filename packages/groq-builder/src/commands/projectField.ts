import { GroqBuilder } from "../groq-builder";
import { ResultItem, ResultOverride } from "../types/result-types";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     * @param fieldName
     */
    field<TProjectionKey extends ProjectionKey<ResultItem<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultOverride<
        TResult,
        ProjectionKeyValue<ResultItem<TResult>, TProjectionKey>
      >,
      TRootConfig
    >;

    /** @deprecated Please use the 'field' method for naked projections */
    projectField: never;
    /** @deprecated Please use the 'field' method for naked projections */
    projectNaked: never;
  }
}

GroqBuilder.implement({
  field(this: GroqBuilder, fieldName: string) {
    if (this.internal.query) {
      fieldName = "." + fieldName;
    }
    return this.chain<any>(fieldName, null);
  },
});
