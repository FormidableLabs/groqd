import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import {
  ConditionalConfig,
  ConditionalKey,
  ConditionalProjectionMap,
  ExtractConditionalProjectionResults,
} from "./conditional-types";
import { notNull } from "../types/utils";
import { ParserFunction } from "../types/public-types";
import { ProjectionMap } from "./projection-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TQueryConfig> {
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
      TConditionalProjections,
      ConditionalConfig<TKey, TIsExhaustive>
    >;
  }
}

const DEFAULT_KEY = "[KEY]" as const;

GroqBuilder.implement({
  conditional<
    TCP extends object,
    TKey extends string,
    TIsExhaustive extends boolean
  >(
    this: GroqBuilder,
    conditionalProjections: TCP,
    config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
  ) {
    const root = this.root;
    const allConditionalProjections = Object.entries(
      conditionalProjections
    ).map(([condition, projectionMap]) => {
      const conditionalProjection = root
        .chain(`${condition} =>`)
        .project(projectionMap as ProjectionMap<unknown>);

      return conditionalProjection;
    });

    const { newLine } = this.indentation;
    const query = allConditionalProjections
      .map((q) => q.query)
      .join(`,${newLine}`);

    const parsers = allConditionalProjections
      .map((q) => q.internal.parser)
      .filter(notNull);
    const conditionalParser = !parsers.length
      ? null
      : createConditionalParserUnion(parsers, config?.isExhaustive ?? false);

    const conditionalQuery = root.chain(query, conditionalParser);
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
    for (const parser of parsers) {
      try {
        return parser(input);
      } catch (err) {
        // All errors are ignored,
        // since we never know if it errored due to invalid data,
        // or if it errored due to not meeting the conditional check.
      }
    }
    if (isExhaustive) {
      throw new TypeError(
        `The data did not match any of the ${parsers.length} conditional assertions`
      );
    }
    return {};
  };
}
