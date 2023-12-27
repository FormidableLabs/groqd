import { GroqBuilder } from "../groq-builder";
import { ResultItem, ResultOverride } from "../types/result-types";
import { keys, Simplify, ValueOf } from "../types/utils";
import {
  ExtractSelectByTypeResult,
  SelectByTypeProjections,
  SelectProjections,
} from "./select-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    selectByType<
      TSelectByTypeProjections extends SelectByTypeProjections<
        ResultItem<TResult>,
        TRootConfig
      >
    >(
      typeQueries: TSelectByTypeProjections
    ): GroqBuilder<
      ResultOverride<
        TResult,
        Simplify<ExtractSelectByTypeResult<TSelectByTypeProjections>>
      >,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  selectByType(this: GroqBuilder, typeQueries) {
    const mapped: SelectProjections<any, any> = {};
    const root = this.root;
    for (const key of keys(typeQueries)) {
      const condition = `_type == "${key}"`;
      const queryFn = typeQueries[key] as (q: GroqBuilder) => GroqBuilder;
      mapped[condition] = queryFn(root);
    }
    return this.select$(mapped) as any;
  },
});
