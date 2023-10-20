import { GroqBuilder } from "../groq-builder";
import { StringKeys } from "../utils/common-types";
import { MaybeArrayItem } from "../utils/type-utils";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    slug(
      fieldName: StringKeys<keyof MaybeArrayItem<TScope>>
    ): GroqBuilder<
      TScope extends Array<infer TScopeItem> ? Array<string> : string,
      TRootConfig
    >;
  }
}

GroqBuilder.implement({
  slug(this: GroqBuilder<any, RootConfig>, fieldName) {
    return this.chain(`${fieldName}.current`, null);
  },
});
