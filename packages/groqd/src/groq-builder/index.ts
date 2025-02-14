import {
  GroqBuilderConfigType,
  GroqBuilderResultType,
  IGroqBuilder,
  Parser,
  ParserFunction,
} from "../types/public-types";
import type { QueryConfig } from "../types/query-config";
import { normalizeValidationFunction } from "../commands/validate-utils";
import { ValidationErrors } from "../validation/validation-errors";
import type { Empty } from "../types/utils";
import { InvalidQueryError } from "../types/invalid-query-error";
import { Constructor } from "type-fest";

export type RootResult = Empty;

export type GroqBuilderOptions = {
  /**
   * Enables "pretty printing" for the compiled GROQ string. Useful for debugging.
   * @default "" (disabled)
   */
  indent?: string;
  /**
   * If enabled, then runtime validation is always required for all fields.
   * If missing, an error will be thrown when the query is created.
   *
   * This affects the following 3 APIs where validation is normally optional:
   *
   * q.project({
   *   example: true, // ⛔️ use a validation function instead
   *   example: q.string(), // ✅
   *
   *   example: "example.current", // ⛔️ use a tuple instead
   *   example: ["example.current", q.string()], // ✅
   *
   *   example: q.field("example.current"), // ⛔️ ensure you pass the 2nd validation parameter
   *   example: q.field("example.current", q.string()), // ✅
   * })
   *
   * @default false
   */
  validationRequired?: boolean;
};

/**
 * This class contains the base functionality
 * needed by all GroqBuilder classes.
 */
export class GroqBuilderBase<
  TResult = any,
  TQueryConfig extends QueryConfig = QueryConfig
> implements IGroqBuilder<TResult>
{
  // @ts-expect-error --- This property doesn't actually exist, it's only used to capture type info
  readonly [GroqBuilderResultType]: TResult;
  // @ts-expect-error --- This property doesn't actually exist, it's only used to capture type info
  readonly [GroqBuilderConfigType]: TQueryConfig;

  constructor(
    protected readonly internal: {
      readonly query: string;
      readonly parser: null | ParserFunction;
      readonly options: GroqBuilderOptions;
    }
  ) {}

  /**
   * The GROQ query as a string
   */
  public get query() {
    return this.internal.query;
  }

  /**
   * The parser function that should be used to parse result data
   */
  public get parser(): null | ParserFunction<unknown, TResult> {
    return this.internal.parser;
  }

  /**
   * Parses and validates the query results,
   * passing all data through the parsers.
   */
  public parse(data: unknown): TResult {
    const parser = this.internal.parser;
    if (!parser && this.internal.options.validationRequired) {
      throw new InvalidQueryError(
        "MISSING_QUERY_VALIDATION",
        "Because 'validationRequired' is enabled, " +
          "every query must have validation (like `q.string()`), " +
          "but this query is missing it!"
      );
    }

    if (!parser) {
      return data as TResult;
    }
    try {
      return parser(data);
    } catch (err) {
      // Ensure we throw a ValidationErrors instance:
      if (err instanceof ValidationErrors) {
        throw err.withMessage();
      }
      const v = new ValidationErrors();
      v.add(null, data, err as Error);
      throw v.withMessage();
    }
  }

  /**
   * Returns a new GroqBuilder, appending the query.
   *
   * Use this when the query changes the result type.
   * Use `.pipe` when not changing the result type.
   *
   * @internal
   */
  protected chain<TResultNew = TResult>(
    query: string,
    parser?: Parser | null
  ): GroqBuilder<TResultNew, TQueryConfig> {
    if (this.internal.parser) {
      /**
       * This happens if you accidentally chain too many times, like:
       *
       * q.star
       *   .project({ a: q.string() })
       *   .field("a")
       *
       * The first part of this projection should NOT have validation,
       * since this data will never be sent client-side.
       * This should be rewritten as:
       *
       * q.star
       *   .project({ a: true })
       *   .field("a", q.string())
       */
      throw new InvalidQueryError(
        "CHAINED_ASSERTION_ERROR",
        "You cannot chain a new query after you've specified a validation function, " +
          "since this changes the result type.",
        {
          existingParser: this.internal.parser,
          existingQuery: this.internal.query,
          newQuery: query,
        }
      );
    }
    return this.extend({
      query: this.query + query,
      parser: normalizeValidationFunction(parser),
    });
  }

  /**
   * Returns a new GroqBuilder, appending the query.
   *
   * This method should be used when NOT changing the result type.  Use `.chain` if you're changing the result type.
   *
   * @internal
   */
  protected pipe(query: string): GroqBuilder<TResult, TQueryConfig> {
    return this.extend({
      query: this.query + query,
    });
  }

  /**
   * Returns a new GroqBuilder, extending the current one with the given parameters.
   * @internal
   */
  protected extend<
    TResultNew = TResult,
    TQueryConfigNew extends QueryConfig = TQueryConfig
  >(overrides: Partial<typeof this.internal>) {
    return new GroqBuilder<TResultNew, TQueryConfigNew>({
      ...this.internal,
      ...overrides,
    });
  }

  /**
   * Returns an empty "child" GroqBuilder,
   * used for subqueries in a projection.
   *
   * @internal
   */
  protected get subquery() {
    let options = this.internal.options;
    // Make the query pretty, if needed:
    if (options.indent) {
      options = { ...options, indent: options.indent + "  " };
    }

    return new GroqBuilderSubquery<RootResult, TQueryConfig>({
      query: "",
      parser: null,
      options: options,
    });
  }

  /**
   * This utility returns whitespace, if 'indent' is enabled.
   */
  protected get indentation() {
    const indent = this.internal.options.indent;
    return {
      newLine: indent ? `\n${indent}` : " ",
      space: indent ? "  " : "",
    };
  }

  /**
   * Extends this GroqBuilder class by implementing methods.
   * This allows the class to be split across multiple files in the `../commands/` folder.
   */
  public static implement<TGroqBuilder extends GroqBuilderBase>(
    this: Constructor<TGroqBuilder>,
    methods: Partial<Omit<TGroqBuilder, keyof GroqBuilderBase>>
  ) {
    Object.assign(this.prototype, methods);
  }

  /**
   * Extends this GroqBuilder class by implementing properties.
   * This allows the class to be split across multiple files in the `../commands/` folder.
   */
  public static implementProperties<TGroqBuilder extends GroqBuilderBase>(
    this: Constructor<TGroqBuilder>,
    properties: {
      [P in keyof TGroqBuilder]?: PropertyDescriptor;
    }
  ) {
    Object.defineProperties(
      this.prototype,
      properties as PropertyDescriptorMap
    );
  }
}

/**
 * This GroqBuilder only contains the methods
 * that can be used at the top-level of a query,
 * like `star` and `project`.
 *
 * It also contains certain utilities, like `fragment` and `value`.
 */
export class GroqBuilderRoot<
  TResult = any,
  TQueryConfig extends QueryConfig = QueryConfig
> extends GroqBuilderBase<TResult, TQueryConfig> {}

/**
 * This GroqBuilder only contains the methods
 * that can be used inside a subquery of a projection,
 * like `field` and `project`.
 * Unlike `q`, it is strongly-typed according to the
 * context of the current projection.
 *
 * It also contains certain utilities that can be used
 * inside a projection, like `conditional` and `select`.
 */
export class GroqBuilderSubquery<
  TResult = any,
  TQueryConfig extends QueryConfig = QueryConfig
> extends GroqBuilderBase<TResult, TQueryConfig> {}

/**
 * This GroqBuilder is a chainable query builder.
 *
 * All instances are immutable.
 */
export class GroqBuilder<
  /**
   * The result type of the query
   */
  TResult = any,
  /**
   * Contains extra type info,
   * like the Sanity schema, parameters, and scope
   */
  TQueryConfig extends QueryConfig = QueryConfig
> extends GroqBuilderBase<TResult, TQueryConfig> {}
