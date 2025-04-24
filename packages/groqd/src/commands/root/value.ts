import {
  GroqBuilder,
  GroqBuilderRoot,
  GroqBuilderSubquery,
} from "../../groq-builder";
import { Parser } from "../../types/parser-types";
import { QueryConfig } from "../../types/query-config";

declare module "../../groq-builder" {
  export interface GroqBuilderRoot<TResult, TQueryConfig>
    extends ValueDefinition<TResult, TQueryConfig> {}
  export interface GroqBuilderSubquery<TResult, TQueryConfig>
    extends ValueDefinition<TResult, TQueryConfig> {}
}

interface ValueDefinition<_TResult, TQueryConfig extends QueryConfig> {
  /**
   * Returns a literal Groq value, properly escaped.
   * @param value
   * @param validation
   */
  value<T extends LiteralValueTypes>(
    value: T,
    validation?: Parser<T, T> | null
  ): GroqBuilder<T, TQueryConfig>;
}
const valueImplementation: ValueDefinition<any, any> = {
  value(this: GroqBuilderRoot, value, validation = null) {
    return this.chain(escapeValue(value), validation);
  },
};
GroqBuilderRoot.implement(valueImplementation);
GroqBuilderSubquery.implement(valueImplementation);

export type LiteralValueTypes = string | boolean | number | null;

function escapeValue(value: LiteralValueTypes): string {
  return JSON.stringify(value);
}
