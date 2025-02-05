import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { Expressions } from "../types/groq-expressions";
import { StringKeys } from "../types/utils";
declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Used to pipe a list of results through the score GROQ function.
     */
    score<TKeys extends StringKeys<keyof ResultItem.Infer<TResult>>>(
      ...scoringString: Array<
        Expressions.Matching<ResultItem.Infer<TResult>, TQueryConfig> | TKeys
      >
    ): GroqBuilder<
      Array<ResultItem.Infer<TResult> & { _score: string }>,
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  score(this: GroqBuilder, ...scoringString) {
    const query = ` | score(${scoringString.join(", ")})`;
    return this.chain(query);
  },
});
