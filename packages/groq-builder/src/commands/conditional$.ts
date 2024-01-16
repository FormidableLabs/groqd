import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import {
  ConditionalConfig,
  ConditionalKey,
  ConditionalProjectionMap,
  ExtractConditionalProjectionResults,
  SpreadableConditionals,
} from "./conditional-types";
import { notNull } from "../types/utils";
import { ParserFunction } from "../types/public-types";
import { ProjectionMap } from "./projection-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    conditional$<
      TConditionalProjections extends ConditionalProjectionMap<
        ResultItem<TResult>,
        TRootConfig
      >,
      TKey extends string = "[$]"
    >(
      conditionalProjections: TConditionalProjections,
      config?: ConditionalConfig<TKey>
    ): ExtractConditionalProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections,
      TKey
    >;
  }
}

GroqBuilder.implement({
  conditional$<TCP extends object, TKey extends string>(
    this: GroqBuilder,
    conditionalProjections: TCP,
    config?: ConditionalConfig<TKey>
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
      : createConditionalParserUnion(parsers);

    const conditionalQuery = root.chain(query, conditionalParser);
    const uniqueKey: ConditionalKey<TKey> = `[Conditional] ${
      config?.key ?? ("[$]" as TKey)
    }`;

    return {
      [uniqueKey]: conditionalQuery,
    } as unknown as SpreadableConditionals<TKey, any>;
  },
});

function createConditionalParserUnion(parsers: ParserFunction[]) {
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
    return {};
  };
}
