import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import {
  ProjectionKey,
  ProjectionKeyValue,
  ValidateParserInput,
} from "./projection-types";
import { Parser, ParserWithWidenedInput } from "../types/public-types";
import { maybeArrayParser } from "../validation/simple-validation";
import { normalizeValidationFunction } from "./validate-utils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload does NOT perform any runtime validation; the return type is inferred.
     */
    field<
      TProjectionKey extends ProjectionKey<
        ResultItem.Infer<TResult> & TQueryConfig["scope"]
      >
    >(
      fieldName: TProjectionKey
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        ProjectionKeyValue<
          ResultItem.Infer<TResult> & TQueryConfig["scope"],
          TProjectionKey
        >
      >,
      TQueryConfig
    >;

    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload allows a parser to be passed, for validating the results.
     */
    field<
      TProjectionKey extends ProjectionKey<
        ResultItem.Infer<TResult> & TQueryConfig["scope"]
      >,
      TParser extends ParserWithWidenedInput<
        ProjectionKeyValue<
          ResultItem.Infer<TResult> & TQueryConfig["scope"],
          TProjectionKey
        >
      >
    >(
      fieldName: TProjectionKey,
      parser: TParser
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        TParser extends Parser<infer TParserInput, infer TParserOutput>
          ? ValidateParserInput<
              ProjectionKeyValue<
                ResultItem.Infer<TResult> & TQueryConfig["scope"],
                TProjectionKey
              >,
              TParserInput,
              TParserOutput,
              TProjectionKey
            >
          : never
      >,
      TQueryConfig
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

    // Transparently handle arrays or objects:
    const arrayParser = maybeArrayParser(normalizeValidationFunction(parser));

    return this.chain(fieldName, arrayParser);
  },
});
