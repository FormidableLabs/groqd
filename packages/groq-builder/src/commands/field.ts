import { GroqBuilder } from "../groq-builder";
import { StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    field<TFieldName extends StringKeys<keyof TScope>>(
      fieldName: TFieldName
    ): GroqBuilder<TScope[TFieldName], TRootConfig>;
  }
}

GroqBuilder.implement({
  field(this: GroqBuilder<any, any>, fieldName: string) {
    return this.chain(fieldName, null);
  },
});
