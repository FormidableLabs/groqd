import { GroqBuilderBase } from "../groq-builder";
import { Parser } from "../types/public-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilderBase<TResult, TQueryConfig> {
    /**
     * This is an "escape hatch" allowing you to write any groq query you want.
     *
     * To ensure the correct result type,
     * you must either provide a validation function,
     * or specify the type parameter manually.
     *
     * This should only be used for unsupported features,
     * since it ignores the schema.
     *
     * @example
     * q.star.filterByType("user").project({
     *   name: q.raw('firstName + " " + lastName', zod.string()),
     *   tags: q.raw<string>('array::join(tags, ", ")'),
     * })
     *
     * @param query - This raw GROQ query gets appended to the current query
     * @param parser - A function that validates the incoming data.
     *                 Use "passthrough" to indicate that it's OK for
     *                 the previous parser to be used with this new data
     *                 (i.e. the raw query doesn't change the result type).
     */
    raw<TResultNew = unknown>(
      query: string,
      parser?: Parser<unknown, TResultNew> | null
    ): GroqBuilder<TResultNew, TQueryConfig>;
    raw<TResultNew = TResult>(
      query: string,
      parser: "passthrough"
    ): GroqBuilder<TResultNew, TQueryConfig>;
  }
}
const rawImplementation: Pick<GroqBuilderBase, "raw"> = {
  raw(this: GroqBuilderBase, query, parser) {
    return this.chain(query, parser);
  },
};
GroqBuilderBase.implement(rawImplementation);
