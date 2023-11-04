import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    parse<TScopeNew>(
      parser:
        | ParserObject<TScope, TScopeNew>
        | ParserFunction<TScope, TScopeNew>
    ): GroqBuilder<TScopeNew, TRootConfig>;
  }
}

GroqBuilder.implement({
  parse(this: GroqBuilder<any, any>, parser) {
    let parserFn: ParserFunction<any, any>;
    if (typeof parser === "function") {
      parserFn = parser;
    } else if (isParserObject(parser)) {
      parserFn = (input) => parser.parse(input);
    } else {
      throw new TypeError(`Parser must be a function or an object`);
    }
    return this.chain("", parserFn);
  },
});

export function isParserObject(
  value: unknown
): value is ParserObject<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "parse" in value &&
    typeof value.parse === "function"
  );
}
