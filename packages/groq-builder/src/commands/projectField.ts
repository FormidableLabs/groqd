import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";
import { Parser } from "../types/public-types";
import { inferSymbol } from "./functions/infer";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     */
    field<
      TProjectionKey extends ProjectionKey<ResultItem.Infer<TResult>>,
      TParser extends
        | inferSymbol
        | Parser<ProjectionKeyValue<ResultItem.Infer<TResult>, TProjectionKey>>
    >(
      fieldName: TProjectionKey,
      parser: TParser
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        TParser extends inferSymbol
          ? ProjectionKeyValue<ResultItem.Infer<TResult>, TProjectionKey>
          : TParser extends Parser<
              ProjectionKeyValue<ResultItem.Infer<TResult>, TProjectionKey>,
              infer TOutput
            >
          ? TOutput
          : never
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
  field(this: GroqBuilder, fieldName: string, parser) {
    if (this.internal.query) {
      fieldName = "." + fieldName;
    }

    return this.chain(fieldName, parser === inferSymbol ? null : parser);
  },
});
