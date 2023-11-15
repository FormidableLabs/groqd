import { GroqBuilder } from "../groq-builder";
import { ArrayItem, StringKeys } from "../types/utils";
import { RootConfig } from "../types/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig extends RootConfig> {
    filterBy<
      TKey extends StringKeys<keyof ArrayItem<TResult>>,
      TValue extends Extract<ArrayItem<TResult>[TKey], string>
    >(
      filterString: `${TKey} == "${TValue}"`
    ): GroqBuilder<
      Array<Extract<ArrayItem<TResult>, { [P in TKey]: TValue }>>,
      TRootConfig
    >;

    filterByType<
      TType extends Extract<ArrayItem<TResult>, { _type: string }>["_type"]
    >(
      type: TType
    ): GroqBuilder<
      Array<Extract<ArrayItem<TResult>, { _type: TType }>>,
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
