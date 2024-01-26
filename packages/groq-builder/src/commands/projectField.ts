import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     * @param fieldName
     */
    field<TProjectionKey extends ProjectionKey<ResultItem.Infer<TResult>>>(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        ProjectionKeyValue<ResultItem.Infer<TResult>, TProjectionKey>
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
    return this.chain(fieldName, null);
  },
});
