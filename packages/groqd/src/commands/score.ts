import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Used to pipe a list of results through the score GROQ function.
     */
    score(
      scoringString: string
    ): GroqBuilder<
      Array<ResultItem.Infer<TResult> & { _score: string }>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  score(this: GroqBuilder, scoringString) {
    const query = ` | score(${scoringString})`;
    return this.chain(query);
  },
});
