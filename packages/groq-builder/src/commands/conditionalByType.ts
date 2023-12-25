import { GroqBuilder } from "../groq-builder";
import { RootConfig } from "../types/schema-types";
import { ResultItem } from "../types/result-types";
import {
  ConditionalByTypeProjections,
  ConditionalProjections,
  WrapConditionalByTypeProjectionResults,
} from "./conditional-types";
import { keys } from "../types/utils";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    conditionalByType<
      TConditionalProjections extends ConditionalByTypeProjections<
        ResultItem<TResult>,
        TRootConfig
      >
    >(
      conditionalProjections: TConditionalProjections
    ): WrapConditionalByTypeProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections
    >;
  }
}

GroqBuilder.implement({
  conditionalByType(
    this: GroqBuilder<any, RootConfig>,
    conditionalProjections
  ) {
    const conditions: ConditionalProjections<any, RootConfig> = {};
    for (const _type of keys(conditionalProjections)) {
      conditions[`_type == "${_type}"`] = conditionalProjections[_type] as any;
    }
    return this.conditional$(conditions) as any;
  },
});
