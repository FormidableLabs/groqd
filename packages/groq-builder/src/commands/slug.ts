import { GroqBuilder } from "../groq-builder";
import { EntriesOf } from "../types/utils";
import { ResultItem, ResultOverride } from "../types/result-types";

declare module "../groq-builder" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface GroqBuilder<TResult, TRootConfig> {
    slug(
      fieldName: FieldsWithSlugs<ResultItem<TResult>>
    ): GroqBuilder<ResultOverride<TResult, string>, TRootConfig>;
  }
}
GroqBuilder.implement({
  slug(this: GroqBuilder, fieldName) {
    return this.projectField(`${fieldName}.current` as never).validate(
      (input) => {
        if (typeof input !== "string")
          throw new TypeError(
            `Expected a string for '${fieldName}.current' but got ${input}`
          );
        return input;
      }
    );
  },
});

/**
 * Winner of silliest type name in this repo
 */
type FieldsWithSlugs<TResultItem> = Extract<
  EntriesOf<TResultItem>,
  [any, { current: string }]
>[0];
