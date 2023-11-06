import type { ParserFunction } from "./utils/common-types";
import type { RootConfig } from "./utils/schema-types";
import { chainParsers } from "./commands/parseUtils";

export type GroqBuilderOptions = {
  indent: string;
};

export class GroqBuilder<TScope, TRootConfig extends RootConfig> {
  /**
   * Extends the GroqBuilder class by implementing methods.
   * This allows for this class to be split across multiple files in the `./commands/` folder.
   * @internal
   */
  static implement(methods: Partial<GroqBuilder<any, any>>) {
    Object.assign(GroqBuilder.prototype, methods);
  }

  static implementProperties(properties: {
    [P in keyof GroqBuilder<any, any>]?: PropertyDescriptor;
  }) {
    Object.defineProperties(
      GroqBuilder.prototype,
      properties as PropertyDescriptorMap
    );
  }

  constructor(
    protected readonly internal: {
      readonly query: string;
      readonly parser: null | ParserFunction<unknown, TScope>;
      readonly options: GroqBuilderOptions;
    }
  ) {}

  public get query() {
    return this.internal.query;
  }
  public get parser() {
    return this.internal.parser;
  }

  /**
   * Chains a new query to the existing one.
   */
  protected chain<TScopeNew = TScope>(
    query: string,
    parser: ParserFunction | null = null
  ): GroqBuilder<TScopeNew, TRootConfig> {
    return new GroqBuilder({
      query: this.internal.query + query,
      parser: chainParsers(this.internal.parser, parser),
      options: this.internal.options,
    });
  }

  /**
   * Untyped "escape hatch" allowing you to write any query you want
   */
  public any<TScopeNew = TScope>(query: string, parse?: ParserFunction | null) {
    return this.chain<TScopeNew>(query, parse);
  }
}
