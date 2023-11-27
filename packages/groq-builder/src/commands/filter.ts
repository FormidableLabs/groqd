import { GroqBuilder } from "../groq-builder";
import { StringKeys } from "../types/utils";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    filterBy<
      TKey extends StringKeys<keyof ResultItem<TResult>>,
      TValue extends Extract<ResultItem<TResult>[TKey], string>
    >(
      filterString: `${TKey} == "${TValue}"`
    ): GroqBuilder<
      ResultOverride<
        TResult,
        Extract<ResultItem<TResult>, { [P in TKey]: TValue }>
      >,
      TRootConfig
    >;

    filterByType<
      TType extends Extract<ResultItem<TResult>, { _type: string }>["_type"]
    >(
      type: TType
    ): GroqBuilder<
      ResultOverride<TResult, Extract<ResultItem<TResult>, { _type: TType }>>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  filterBy(this: GroqBuilder, filterString) {
    return this.chain(`[${filterString}]`, null);
  },
  filterByType(this: GroqBuilder, type) {
    return this.chain(`[_type == "${type}"]`, null);
  },
});
