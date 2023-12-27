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
      TSelectProjections extends SelectByTypeProjections<
        ResultItem<TResult>,
        TRootConfig
      >
    >(
      typeProjections: TSelectProjections
    ): GroqBuilder<
      ResultOverride<
        TResult,
        Simplify<ExtractSelectByTypeResult<TSelectProjections>>
      >,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  selectByType(this: GroqBuilder, typeProjections) {
    const mapped: SelectProjections<any, any> = {};
    const root = this.root;
    for (const key of keys(typeProjections)) {
      const condition = `_type == "${key}"`;
      const selectFn = typeProjections[key];
      mapped[condition] = selectFn(root);
    }
    console.log({ mapped });
    return this.select$(mapped);
  },
});
