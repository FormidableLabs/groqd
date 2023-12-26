import { GroqBuilder } from "../../groq-builder";
import { Parser } from "../../types/public-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    value<T extends LiteralValueTypes>(
      value: T,
      validation?: Parser<T, T>
    ): GroqBuilder<T, TRootConfig>;
  }
}

GroqBuilder.implement({
  value(this: GroqBuilder, value) {
    return this.chain(escapeValue(value));
  },
});

export type LiteralValueTypes = string | boolean | number | null;

function escapeValue(value: LiteralValueTypes): string {
  return JSON.stringify(value);
}
