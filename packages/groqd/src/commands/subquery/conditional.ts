import { GroqBuilderSubquery } from "../../groq-builder";
import { ResultItem } from "../../types/result-types";
import {
  ConditionalConfig,
  ConditionalKey,
  ConditionalProjectionMap,
  ConditionalQuery,
  ExtractConditionalProjectionResults,
  normalizeConditionalQuery,
} from "./conditional-types";
import { notNull } from "../../types/utils";
import { ParserFunction } from "../../types/parser-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderSubquery<TResult, TQueryConfig> {
    /**
     * Creates an inline conditional projection.
     *
     * The Condition strings are NOT strongly-typed.  You can put any valid GROQ statement into these keys.  See `conditionalByType` for a strongly-typed option.
     *
     * @example
     * q.star.filterByType("product").project(sub => ({
     *   name: z.string(),
     *   ...sub.conditional({
     *     "price == msrp": {
     *       onSale: q.value(false),
     *     },
     *     "price < msrp": {
     *       onSale: q.value(true),
     *       price: z.number(),
     *       msrp: z.number(),
     *     },
     *   }),
     * }))
     */
    conditional<
      TConditionalProjections extends ConditionalProjectionMap<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >,
      TKey extends string = typeof DEFAULT_KEY,
      TIsExhaustive extends boolean = false
    >(
      conditionalProjections: TConditionalProjections,
      config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
    ): ExtractConditionalProjectionResults<
      ResultItem.Infer<TResult>,
      TQueryConfig,
      TConditionalProjections,
      ConditionalConfig<TKey, TIsExhaustive>
    >;
  }
}

const DEFAULT_KEY = "[KEY]" as const;

GroqBuilderSubquery.implement({
  conditional<
    TCP extends object,
    TKey extends string,
    TIsExhaustive extends boolean
  >(
    this: GroqBuilderSubquery,
    conditionalProjections: TCP,
    config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
  ) {
    const subquery = this.subquery;
    const allConditionalProjections = Object.entries(
      conditionalProjections
    ).map(
      ([condition, conditionalQuery]: [string, ConditionalQuery<any, any>]) => {
        return normalizeConditionalQuery(subquery, condition, conditionalQuery);
      }
    );

    const { newLine } = this.indentation;
    const query = allConditionalProjections
      .map((q) => q.query)
      .join(`,${newLine}`);

    const parsers = allConditionalProjections
      .map((q) => q.parser)
      .filter(notNull);
    const conditionalParser = !parsers.length
      ? null
      : createConditionalParserUnion(parsers, config?.isExhaustive ?? false);

    const conditionalQuery = subquery.chain(query, conditionalParser);
    const key = config?.key || (DEFAULT_KEY as TKey);
    const conditionalKey: ConditionalKey<TKey> = `[CONDITIONAL] ${key}`;
    return {
      [conditionalKey]: conditionalQuery,
    } as any;
  },
});

function createConditionalParserUnion(
  parsers: ParserFunction[],
  isExhaustive: boolean
) {
  return function parserUnion(input: unknown) {
    let foundMatch = false;
    const result = {};
    for (const parser of parsers) {
      try {
        const parsed = parser(input);
        Object.assign(result, parsed);
        foundMatch = true;
      } catch (err) {
        // All errors are ignored,
        // since we never know if it errored due to invalid data,
        // or if it errored due to not meeting the conditional check.
      }
    }
    if (isExhaustive && !foundMatch) {
      throw new TypeError(
        `The data did not match any of the ${parsers.length} conditional assertions`
      );
    }
    return result;
  };
}
