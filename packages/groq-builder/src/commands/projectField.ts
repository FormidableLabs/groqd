import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";
import { Parser } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload does NOT perform any runtime validation; the return type is inferred.
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

    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload allows a parser to be passed, for validating the results.
     */
    field<
      TProjectionKey extends ProjectionKey<ResultItem.Infer<TResult>>,
      TParser extends Parser<
        ProjectionKeyValue<ResultItem.Infer<TResult>, TProjectionKey>,
        any
      >
    >(
      fieldName: TProjectionKey,
      parser: TParser
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        TParser extends Parser<
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
  field(this: GroqBuilder, fieldName: string, parser?: Parser): GroqBuilder {
    if (this.internal.query) {
      fieldName = "." + fieldName;
    }

    return this.chain(fieldName, parser);
  },
});
