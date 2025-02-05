import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { Expressions } from "../types/groq-expressions";
declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Used to pipe a list of results through the score GROQ function.
     */
    score(
      ...scoringExpressions: Array<
        Expressions.Score<ResultItem.Infer<TResult>, TQueryConfig>
      >
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        ResultItem.Infer<TResult> & { _score: number }
      >,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  score(this: GroqBuilder, ...scoringExpressions) {
    return this.chain(` | score(${scoringExpressions.join(", ")})`);
  },
});
