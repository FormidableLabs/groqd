import { GroqBuilder } from "../groq-builder";
import { ParserFunction, ParserObject } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

import { getParserFunction } from "./parseUtils";

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
    return this.chain("", getParserFunction(parser));
  },
});
