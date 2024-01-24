import { GroqBuilder } from "../groq-builder";
import { InferResultItem } from "../types/result-types";
import { ExtractSelectResult, SelectProjections } from "./select-types";
import { notNull } from "../types/utils";
import { InferResultType, ParserFunction } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    select$<
      TSelectProjections extends SelectProjections<
        InferResultItem<TResult>,
        TRootConfig
      >,
      TDefault extends null | GroqBuilder = null
    >(
      selections: TSelectProjections,
      defaultSelection?: TDefault
    ): GroqBuilder<
      | ExtractSelectResult<TSelectProjections>
      | (TDefault extends null | undefined
          ? null
          : InferResultType<NonNullable<TDefault>>),
      TRootConfig
    >;
  }
}
GroqBuilder.implement({
  select$(this: GroqBuilder, selections, defaultSelection): GroqBuilder<any> {
    const conditions = Object.keys(selections);

    const queries = conditions.map((condition) => {
      const builder = selections[condition];
      return `${condition} => ${builder.query}`;
    });

    if (defaultSelection) {
      queries.push(defaultSelection.query);
    }

    const parsers = conditions
      .map((c) => selections[c].internal.parser)
      .filter(notNull);
    const conditionalParser =
      parsers.length === 0
        ? null
        : createConditionalParser(parsers, defaultSelection?.internal.parser);

    // Check that we've got "all or nothing" parsers:
    if (parsers.length !== 0 && parsers.length !== conditions.length) {
      const missing = conditions.filter((c) => !selections[c].internal.parser);
      const err = new TypeError(
        "When using 'select', either all conditions must have validation, or none of them. " +
          `Missing validation: "${missing.join('", "')}"`
      );
      Error.captureStackTrace(err, GroqBuilder.prototype.select$);
      throw err;
    }

    const { newLine, space } = this.indentation;
    return this.chain(
      `select(${newLine}${space}${queries.join(
        `,${newLine}${space}`
      )}${newLine})`,
      conditionalParser
    );
  },
});

function createConditionalParser(
  parsers: Array<ParserFunction>,
  defaultParser?: ParserFunction | null
): ParserFunction {
  return function conditionalParser(input) {
    if (input === null && !defaultParser) {
      return null;
    }
    for (const parser of parsers) {
      try {
        // Returns the first parser that passes without an error:
        const result = parser(input);
        return result;
      } catch (err) {
        // Ignore the error, keep trying
      }
    }

    if (defaultParser) {
      return defaultParser(input);
    }

    throw new TypeError(
      `Conditional parsing failed; all ${parsers.length} conditions failed`
    );
  };
}
