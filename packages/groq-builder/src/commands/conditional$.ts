import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import {
  ConditionalProjections,
  WrapConditionalProjectionResults,
} from "./conditional-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    conditional$<
      TConditionalProjections extends ConditionalProjections<
        ResultItem<TResult>
      >
    >(
      conditionalProjections: TConditionalProjections
    ): WrapConditionalProjectionResults<
      ResultItem<TResult>,
      TConditionalProjections
    >;
  }
}

GroqBuilder.implement({
  conditional$(this: GroqBuilder, conditionalProjections): any {
    // Just pass the object back as-is.
    // The `project` method will turn it into a query.
    // This utility is all about the TypeScript.
    return conditionalProjections;
  },
});
