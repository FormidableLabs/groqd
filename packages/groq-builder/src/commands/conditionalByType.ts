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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const rootQ = this;
    const conditions: ConditionalProjections<any> = {};
    for (const _type of keys(conditionalProjections)) {
      let projectionMap = conditionalProjections[_type];
      if (typeof projectionMap === "function") {
        projectionMap = projectionMap(rootQ);
      }

      const condition = `_type == "${_type}"`;
      conditions[condition] = projectionMap as any;
    }
    return this.conditional$(conditions) as any;
  },
});
