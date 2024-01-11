import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";
import {
  ExtractConditionalByTypeProjectionResults,
  ConditionalByTypeProjectionMap,
  ConditionalKey,
} from "./conditional-types";
import { ProjectionMap } from "./projection-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    conditionalByType<
      TConditionalProjections extends ConditionalByTypeProjectionMap<
        ResultItem<TResult>,
        TRootConfig
      >,
      TKey extends string = "[ByType]"
    >(
      conditionalProjections: TConditionalProjections,
      conditionalKey?: TKey
    ): ExtractConditionalByTypeProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections,
      TKey
    >;
  }
}

GroqBuilder.implement({
  conditionalByType<TConditionalProjections, TKey>(
    this: GroqBuilder<any, RootConfig>,
    conditionalProjections: TConditionalProjections,
    conditionalKey = "[ByType]" as TKey
  ) {
    const typeNames = Object.keys(conditionalProjections as object);

    const root = this.root;
    const conditions = typeNames.map((_type) => {
      const projectionMap = conditionalProjections[
        _type as keyof typeof conditionalProjections
      ] as ProjectionMap<unknown>;
      const conditionQuery = root
        .chain(`_type == "${_type}" =>`)
        .project(projectionMap);
      const { query, parser } = conditionQuery;
      return { _type, query, parser };
    });

    const { newLine } = this.indentation;
    const query = conditions.map((c) => c.query).join(`,${newLine}`);

    const parser = !conditions.some((c) => c.parser)
      ? null
      : function conditionalByTypeParser(input: { _type: string }) {
          // find the right conditional parser
          const conditionalParser = conditions.find(
            (c) => c._type === input._type
          );
          if (conditionalParser?.parser) {
            return conditionalParser.parser(input);
          }
          return {};
        };

    const uniqueKey: ConditionalKey<string> = `[Conditional] ${conditionalKey}`;
    return {
      [uniqueKey]: this.root.chain(query, parser),
    } as any;
  },
});
