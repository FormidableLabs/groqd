import { GroqBuilder } from "../../groq-builder";
import { ResultItem } from "../../types/result-types";
import { ValidateParserInput } from "../../types/projection-types";
import { Parser, ParserWithWidenedInput } from "../../types/public-types";
import { maybeArrayParser } from "../../validation/simple-validation";
import { normalizeValidationFunction } from "./validate-utils";
import {
  ProjectionPaths,
  ProjectionPathValue,
} from "../../types/projection-paths";
import { QueryConfig } from "../../types/query-config";

declare module "../../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderChain<TResult, TQueryConfig>
    extends FieldDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends FieldDefinition<TResult, TQueryConfig> {}

  interface FieldDefinition<TResult, TQueryConfig extends QueryConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload does NOT perform any runtime validation; the return type is inferred.
     */
    field<TProjectionPath extends ProjectionPaths<ResultItem.Infer<TResult>>>(
      fieldName: TProjectionPath
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        ProjectionPathValue<ResultItem.Infer<TResult>, TProjectionPath>
      >,
      TQueryConfig
    >;

    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload allows a parser to be passed, for validating the results.
     */
    field<
      TProjectionPath extends ProjectionPaths<ResultItem.Infer<TResult>>,
      TParser extends ParserWithWidenedInput<
        ProjectionPathValue<ResultItem.Infer<TResult>, TProjectionPath>
      >
    >(
      fieldName: TProjectionPath,
      parser: TParser
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        TParser extends Parser<infer TParserInput, infer TParserOutput>
          ? ValidateParserInput<
              ProjectionPathValue<ResultItem.Infer<TResult>, TProjectionPath>,
              TParserInput,
              TParserOutput,
              TProjectionPath
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
