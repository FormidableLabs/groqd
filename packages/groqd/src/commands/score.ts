import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { Expressions } from "../types/groq-expressions";
declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Used to pipe a list of results through the `score(...)` GROQ function.
     *
     * This method supports strongly-typed expressions, but has limitations.
     * Please use `scoreRaw` if you need to use more complex expressions.
     */
    score(
      ...scoreExpressions: Array<
        Expressions.Score<ResultItem.Infer<TResult>, TQueryConfig>
      >
    ): GroqBuilder<
      ResultItem.Override<
        TResult,
        ResultItem.Infer<TResult> & { _score: number }
      >,
      TQueryConfig
    >;
    /**
     * Used to pipe a list of results through the `score(...)` GROQ function.
     *
     * This method is NOT strongly-typed.
     * Please use the strongly-typed `score` for simple expressions.
     */
    scoreRaw(
      ...scoreExpressions: Array<
        Expressions.ScoreRaw<ResultItem.Infer<TResult>, TQueryConfig>
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
  score(this: GroqBuilder, ...scoreExpressions): GroqBuilder {
    return this.scoreRaw(...scoreExpressions);
  },
  scoreRaw(this: GroqBuilder, ...scoreExpressions) {
    return this.chain(
      ` | score(${scoreExpressions.join(", ")})`,
      "passthrough"
    );
  },
});
