import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../utils/type-utils";
import { StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

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
  filterBy(this: GroqBuilder<any, any>, filterString) {
    return this.chain(`[${filterString}]`, null);
  },
  filterByType(this: GroqBuilder<any, any>, type) {
    return this.chain(`[_type == "${type}"]`, null);
  },
});
