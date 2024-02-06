import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { ExtractSelectResult, SelectProjections } from "./select-types";
import { notNull } from "../types/utils";
import {
  IGroqBuilder,
  InferResultType,
  ParserFunction,
} from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    select<
      TSelectProjections extends SelectProjections<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >,
      TDefault extends null | IGroqBuilder = null
    >(
      selections: TSelectProjections,
      defaultSelection?: TDefault
    ): GroqBuilder<
      | ExtractSelectResult<TSelectProjections>
      | (TDefault extends null | undefined
          ? null
          : InferResultType<NonNullable<TDefault>>),
      TQueryConfig
    >;
  }
}
GroqBuilder.implement({
  select(this: GroqBuilder, selections, defaultSelection): GroqBuilder<any> {
    const conditions = Object.keys(selections);

    const queries = conditions.map((condition) => {
      const builder = selections[condition]!;
      return `${condition} => ${builder.query}`;
    });

    if (defaultSelection) {
      queries.push(defaultSelection.query);
    }

    const parsers = conditions
      .map((c) => selections[c]!.parser)
      .filter(notNull);
    const conditionalParser =
      parsers.length === 0
        ? null
        : createConditionalParser(parsers, defaultSelection?.parser);

    // Check that we've got "all or nothing" parsers:
    if (parsers.length !== 0 && parsers.length !== conditions.length) {
      const missing = conditions.filter((c) => !selections[c]!.parser);
      const err = new TypeError(
        "When using 'select', either all conditions must have validation, or none of them. " +
          `Missing validation: "${missing.join('", "')}"`
      );
      // This only works on V8 engines:
      (Error as any).captureStackTrace?.(err, GroqBuilder.prototype.select);
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
