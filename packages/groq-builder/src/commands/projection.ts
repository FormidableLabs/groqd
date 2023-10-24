import { Get, MaybeArrayItem, TypeMismatchError } from "../utils/type-utils";
import { GroqBuilder } from "../groq-builder";
import { Parser, StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    projection<
      TProjectionString extends StringKeys<keyof MaybeArrayItem<TScope>>
    >(
      fieldName: TProjectionString | `${TProjectionString}[]`
    ): GroqBuilder<
      NonNullable<
        TScope extends Array<infer TScopeItem>
          ? Array<Get<TScopeItem, TProjectionString>>
          : Get<TScope, TProjectionString>
      >,
      TRootConfig
    >;

    projection<
      TProjection extends (TScope extends Array<infer TScopeItem>
        ? {
            [P in keyof TScopeItem]?: ProjectionFieldConfig;
          }
        : {
            [P in keyof TScope]?: ProjectionFieldConfig;
          }) & {
        [P in string]: ProjectionFieldConfig;
      }
    >(
      projectionMap:
        | TProjection
        | ((q: GroqBuilder<MaybeArrayItem<TScope>, TRootConfig>) => TProjection)
    ): GroqBuilder<
      TScope extends Array<infer TScopeItem>
        ? Array<ExtractProjectionResult<TScopeItem, TProjection>>
        : ExtractProjectionResult<TScope, TProjection>,
      TRootConfig
    >;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  export type ProjectionFieldConfig =
    // Use 'true' to include a field as-is
    | true
    // Use a parser to include a field, passing it through the parser at run-time
    | Parser<any, any>
    // Use a GroqBuilder instance to create a nested projection
    | GroqBuilder<any, any>;

  export type ExtractProjectionResult<TScope, TProjection> = {
    [P in keyof TProjection]: TProjection[P] extends GroqBuilder<
      infer TValue,
      any
    > // Extract type from GroqBuilder:
      ? TValue
      : /* Extract type from 'true': */
      TProjection[P] extends boolean
      ? P extends keyof TScope
        ? TScope[P]
        : TypeMismatchError<{
            error: `⛔️ 'true' can only be used for known properties ⛔️`;
            expected: keyof TScope;
            actual: P;
          }>
      : /* Extract type from Parser: */
      TProjection[P] extends Parser<infer TInput, infer TOutput>
      ? P extends keyof TScope
        ? TInput extends TScope[P]
          ? TOutput
          : TypeMismatchError<{
              error: `⛔️ Parser expects a different input type ⛔️`;
              expected: TScope[P];
              actual: TInput;
            }>
        : TypeMismatchError<{
            error: `⛔️ a parser can only be used for known properties ⛔️`;
            expected: keyof TScope;
            actual: P;
          }>
      : never;
  };
}

GroqBuilder.implement({
  projection(this: GroqBuilder<any, any>, arg: string | object) {
    type ProjectionResult = any;
    if (typeof arg === "string") {
      const fieldName = arg;
      return this.chain<ProjectionResult>(fieldName, null);
    }

    const projectionMap = arg;
    const keys = Object.keys(projectionMap) as Array<string>;
    const queryFields = keys.map((key) => {
      const value: unknown = projectionMap[key as keyof typeof projectionMap];
      if (typeof value === "boolean") {
        return { query: key, parser: null };
      } else if (value instanceof GroqBuilder) {
        return value;
      } else if (isParser(value)) {
        return { query: key, parser: value };
      } else {
        throw new Error("Unexpected value" + typeof value);
      }
    });

    const newQuery = `{ ${queryFields.map((q) => q.query).join(", ")} }`;
    const newParser = null;
    return this.chain<ProjectionResult>(newQuery, newParser);
  },
});

function isParser(value: unknown): value is Parser<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "parse" in value &&
    typeof value.parse === "function"
  );
}
