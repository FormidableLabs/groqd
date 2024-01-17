import { GroqBuilder } from "../groq-builder";
import { ExtractTypeNames, RootConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";
import {
  ExtractConditionalByTypeProjectionResults,
  ConditionalByTypeProjectionMap,
  ConditionalKey,
  ConditionalConfig,
} from "./conditional-types";
import { ProjectionMap } from "./projection-types";
import { IsEqual } from "../tests/expectType";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    conditionalByType<
      TConditionalProjections extends ConditionalByTypeProjectionMap<
        ResultItem<TResult>,
        TRootConfig
      >,
      TKey extends string = "[ByType]",
      /**
       * Did we supply a condition for all possible _type values?
       */
      TIsExhaustive extends boolean = ExtractTypeNames<
        ResultItem<TResult>
      > extends keyof TConditionalProjections
        ? true
        : false
    >(
      conditionalProjections: TConditionalProjections,
      config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
    ): ExtractConditionalByTypeProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections,
      ConditionalConfig<TKey, TIsExhaustive>
    >;
  }
}

GroqBuilder.implement({
  conditionalByType<
    TConditionalProjections extends object,
    TKey extends string,
    TIsExhaustive extends boolean
  >(
    this: GroqBuilder<any, RootConfig>,
    conditionalProjections: TConditionalProjections,
    config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
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
          if (!typeParser && config?.isExhaustive) {
            throw new TypeError(
              `Unexpected _type "${input._type}"; expected one of: ${typeNames}`
            );
          }
          return {};
        };

    const conditionalQuery = this.root.chain(query, conditionalParser);
    const key: TKey = config?.key || ("[ByType]" as TKey);
    const conditionalKey: ConditionalKey<TKey> = `[Conditional] ${key}`;
    return {
      _type: true, // Ensure we request the `_type` parameter
      [conditionalKey]: conditionalQuery,
    } as any;
  },
});
