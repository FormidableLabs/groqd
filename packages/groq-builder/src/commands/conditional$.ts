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
        ResultItem<TResult>,
        TRootConfig
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
    // Return an object; the `project` method will turn it into a query.
    return Object.fromEntries(
      Object.entries(conditionalProjections).map(
        ([condition, projectionMap]) => {
          if (typeof projectionMap === "function") {
            projectionMap = projectionMap(this.root);
          }

          const projection = this.root
            .chain(`${condition} => `)
            .project(projectionMap);

          // By returning a key that's equal to the query,
          // this will instruct `project` to output the entry without ":"
          const newKey = projection.query;
          return [newKey, projection];
        }
      )
    );
  },
});
