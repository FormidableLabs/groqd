import type { Parser } from "./utils/common-types";

import type { MaybeArrayItem, SimplifyDeep } from "./utils/type-utils";
import type { RootConfig } from "./utils/schema-types";

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
    /**
     *
     */
    public readonly query: string,
    /**
     *
     */
    public readonly parser: Parser<any, TScope> | null
  ) {}

  /**
   * Chains a new query to the existing one.
   */
  protected chain<TScopeNew = TScope>(
    query: string,
    parser?: Parser<any, any> | null
  ) {
    return new GroqBuilder<TScopeNew, TRootConfig>(
      this.query + query,
      parser || null
    );
  }

  /**
   * Untyped "escape hatch" allowing you to write any query you want
   */
  public any<TScopeNew = TScope>(
    query: string,
    parser?: Parser<any, any> | null
  ) {
    return this.chain<TScopeNew>(query, parser);
  }

  /**
   * Temporary for debugging:
   * @param fetchData
   */
  public async execute(
    fetchData: (query: string) => Promise<unknown>
  ): Promise<TScope> {
    const rawData = await fetchData(this.query);
    const parsed = this.parser?.parse(rawData) || (rawData as TScope);
    return parsed;
  }

  // Temporary; for debugging
  public TScope: SimplifyDeep<TScope> = null as any;
  public TScopeItem: SimplifyDeep<MaybeArrayItem<TScope>> = null as any;
}
