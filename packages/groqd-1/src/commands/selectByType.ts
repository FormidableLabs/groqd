import { GroqBuilder } from "../groq-builder";
import { ResultItem } from "../types/result-types";
import { keys, Simplify } from "../types/utils";
import {
  ExtractSelectByTypeResult,
  SelectByTypeProjections,
  SelectProjections,
} from "./select-types";
import { IGroqBuilder, InferResultType } from "../types/public-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TQueryConfig> {
    /**
     * Applies GROQ's `select` function, for conditional logic,
     * based on the `_type` field.
     *
     * This is similar to `.select`,
     * but provides stronger types and auto-completion.
     *
     * @example
     * const qContent = q.star.filterByType("movie", "actor").project(sub => ({
     *   name: sub.selectByType({
     *     movie: sub => sub.field("title"),
     *     actor: sub => sub.field("name"),
     *   })
     * }));
     */
    selectByType<
      TSelectByTypeProjections extends SelectByTypeProjections<
        ResultItem.Infer<TResult>,
        TQueryConfig
      >,
      TDefaultSelection extends IGroqBuilder | null = null
    >(
      typeQueries: TSelectByTypeProjections,
      defaultSelection?: TDefaultSelection
    ): GroqBuilder<
      | Simplify<ExtractSelectByTypeResult<TSelectByTypeProjections>>
      | (TDefaultSelection extends null | undefined
          ? null
          : InferResultType<NonNullable<TDefaultSelection>>),
      TQueryConfig
    >;
  }
}

GroqBuilder.implement({
  selectByType(this: GroqBuilder, typeQueries, defaultSelection) {
    const mapped: SelectProjections<any, any> = {};
    const root = this.root;
    for (const key of keys(typeQueries)) {
      const condition = `_type == "${key}"`;

      const queryFn = typeQueries[key];
      const query: IGroqBuilder =
        typeof queryFn === "function" ? queryFn(root) : queryFn!;

      mapped[condition] = query;
    }
    return this.select(mapped, defaultSelection) as any;
  },
});
