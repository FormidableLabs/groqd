import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";
import {
  ExtractConditionalByTypeProjectionResults,
  ConditionalByTypeProjectionMap,
  ConditionalKey,
  SpreadableConditionals,
  ConditionalConfig,
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
      config?: ConditionalConfig<TKey>
    ): ExtractConditionalByTypeProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections,
      TKey
    >;
  }
}

GroqBuilder.implement({
  conditionalByType<
    TConditionalProjections extends object,
    TKey extends string
  >(
    this: GroqBuilder<any, RootConfig>,
    conditionalProjections: TConditionalProjections,
    config?: ConditionalConfig<TKey>
  ) {
    const typeNames = Object.keys(conditionalProjections);

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

    const conditionalParser = !conditions.some((c) => c.parser)
      ? null
      : function conditionalByTypeParser(input: { _type: string }) {
          // find the right conditional parser
          const typeParser = conditions.find((c) => c._type === input._type);
          if (typeParser?.parser) {
            return typeParser.parser(input);
          }
          return {};
        };

    const conditionalQuery = this.root.chain(query, conditionalParser);
    const uniqueKey: ConditionalKey<string> = `[Conditional] ${
      config?.key ?? ("[ByType]" as TKey)
    }`;
    return {
      [uniqueKey]: conditionalQuery,
    } as unknown as SpreadableConditionals<TKey, any>;
  },
});
