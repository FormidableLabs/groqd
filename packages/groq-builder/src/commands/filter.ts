import { GroqBuilder } from "../groq-builder";
import { ArrayItem } from "../utils/type-utils";
import { StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    filterBy<
      TKey extends keyof ArrayItem<TScope>,
      TValue extends ArrayItem<TScope>[TKey]
    >(
      filterString: `${StringKeys<TKey>} == "${Extract<TValue, string>}"`
    ): GroqBuilder<
      Array<Extract<ArrayItem<TScope>, { [P in TKey]: TValue }>>,
      TRootConfig
    >;

    filter<TScopeNew extends TScope = TScope>(
      filterString?: string
    ): GroqBuilder<TScopeNew, TRootConfig>;
    filterByType<
      TType extends Extract<ArrayItem<TScope>, { _type: any }>["_type"]
    >(
      type: TType
    ): GroqBuilder<
      Array<Extract<ArrayItem<TScope>, { _type: TType }>>,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  filterBy(this: GroqBuilder<any, any>, filterString) {
    return this.extend(`[${filterString}]`, null);
  },
  filter(this: GroqBuilder<any, any>, filterString = "") {
    return this.extend(`[${filterString}]`, null);
  },
  filterByType(this: GroqBuilder<any, any>, type) {
    return this.extend(`[_type == '${type}']`, null);
  },
});
