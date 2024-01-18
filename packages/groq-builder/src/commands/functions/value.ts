import { GroqBuilder } from "../../groq-builder";
import { Parser } from "../../types/public-types";

declare module "../../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * Returns a literal Groq value, properly escaped.
     * @param value
     * @param validation
     */
    value<T extends LiteralValueTypes>(
      value: T,
      validation?: Parser<T, T> | null
    ): GroqBuilder<T, TRootConfig>;
  }
}

GroqBuilder.implement({
  value(this: GroqBuilder, value, validation = null) {
    return this.chain(escapeValue(value), validation);
  },
});

export type LiteralValueTypes = string | boolean | number | null;

function escapeValue(value: LiteralValueTypes): string {
  return JSON.stringify(value);
}
