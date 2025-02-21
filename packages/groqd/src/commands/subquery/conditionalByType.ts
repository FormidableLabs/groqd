import { GroqBuilderSubquery } from "../../groq-builder";
import { ResultItem } from "../../types/result-types";
import {
  ExtractConditionalByTypeProjectionResults,
  ConditionalByTypeProjectionMap,
  ConditionalKey,
  ConditionalConfig,
} from "./conditional-types";
import { ProjectionMap } from "../../types/projection-types";
import { keys } from "../../types/utils";
import { ExtractDocumentTypes } from "../../types/document-types";

declare module "../../groq-builder" {
  export interface GroqBuilderSubquery<TResult, TQueryConfig> {
    /**
     * Creates an inline conditional projection, based on the `_type` field.
     *
     * This is similar to `.conditional`,
     * but provides stronger types and auto-completion.
     *
     * @example
     * q.star.filterByType("product", "category").project(sub => ({
     *   name: zod.string(),
     *   ...sub.conditionalByType({
     *     product: {
     *       price: zod.number(),
     *     },
     *     category: {
     *       title: zod.string(),
     *     },
     *   }),
     * }))
     */
    conditionalByType<
      TConditionalProjections extends ConditionalByTypeProjectionMap<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >,
      TKey extends string = typeof DEFAULT_KEY,
      /**
       * Did we supply a condition for all possible _type values?
       */
      TIsExhaustive extends boolean = ExtractDocumentTypes<
        ResultItem.Infer<TResult>
      > extends keyof TConditionalProjections
        ? true
        : false
    >(
      conditionalProjections: TConditionalProjections,
      config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
    ): ExtractConditionalByTypeProjectionResults<
      ResultItem.Infer<TResult>,
      TConditionalProjections,
      ConditionalConfig<TKey, TIsExhaustive>
    >;
  }
}
const DEFAULT_KEY = "[BY_TYPE]" as const;

GroqBuilderSubquery.implement({
  conditionalByType<
    TConditionalProjections extends object,
    TKey extends string,
    TIsExhaustive extends boolean
  >(
    this: GroqBuilderSubquery,
    conditionalProjections: TConditionalProjections,
    config?: Partial<ConditionalConfig<TKey, TIsExhaustive>>
  ) {
    const typeNames = keys(conditionalProjections);

    const subquery = this.subquery;
    const conditions = typeNames.map((_type) => {
      const projectionMap = conditionalProjections[
        _type
      ] as ProjectionMap<unknown>;
      const conditionQuery = subquery
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

    const conditionalQuery = this.subquery.chain(query, conditionalParser);
    const key: TKey = config?.key || (DEFAULT_KEY as TKey);
    const conditionalKey: ConditionalKey<TKey> = `[CONDITIONAL] ${key}`;
    return {
      _type: true, // Ensure we request the `_type` parameter
      [conditionalKey]: conditionalQuery,
    } as any;
  },
});
