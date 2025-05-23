import { GroqBuilder, GroqBuilderSubquery } from "../groq-builder";
import { Expressions } from "../types/groq-expressions";
import { ResultItem } from "../types/result-types";
import { ValidateParserInput } from "../types/projection-types";
import { Parser, ParserWithWidenedInput } from "../types/parser-types";
import { maybeArrayParser } from "../validation/simple-validation";
import { normalizeValidationFunction } from "./validate-utils";
import { QueryConfig } from "../types/query-config";

declare module "../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilder<TResult, TQueryConfig>
    extends FieldDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends FieldDefinition<TResult, TQueryConfig> {}

  interface FieldDefinition<TResult, TQueryConfig extends QueryConfig> {
    /**
     * Performs a "naked projection", returning just the values of the field specified.
     *
     * This overload does NOT perform any runtime validation; the return type is inferred.
     */
    field<
      TProjectionPath extends Expressions.Field<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >
    >(
      fieldName: TProjectionPath
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        Expressions.FieldValue<
          ResultItem.Infer<TResult>,
          TQueryConfig,
          TProjectionPath
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
      TProjectionPath extends Expressions.Field<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >,
      TParser extends ParserWithWidenedInput<
        Expressions.FieldValue<
          ResultItem.Infer<TResult>,
          TQueryConfig,
          TProjectionPath
        >
      >
    >(
      fieldName: TProjectionPath,
      parser: TParser
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        TParser extends Parser<infer TParserInput, infer TParserOutput>
          ? ValidateParserInput<
              Expressions.FieldValue<
                ResultItem.Infer<TResult>,
                TQueryConfig,
                TProjectionPath
              >,
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
const fieldImplementation: Pick<GroqBuilder, "field"> = {
  field(this: GroqBuilder, fieldName: string, parser?: Parser): GroqBuilder {
    if (this.internal.query) {
      fieldName = "." + fieldName;
    }

    // Transparently handle arrays or objects:
    const arrayParser = maybeArrayParser(normalizeValidationFunction(parser));

    return this.chain(fieldName, arrayParser);
  },
};

GroqBuilder.implement(fieldImplementation);
GroqBuilderSubquery.implement(fieldImplementation);
