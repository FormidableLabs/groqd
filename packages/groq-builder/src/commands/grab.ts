import {
  Get,
  MaybeArrayItem,
  SimplifyDeep,
  TypeMismatchError,
} from "../utils/type-utils";
import { GroqBuilder } from "../groq-builder";
import { Parser, StringKeys } from "../utils/common-types";
import { RootConfig } from "../utils/schema-types";

declare module "../groq-builder" {
  export interface GroqBuilder<TScope, TRootConfig extends RootConfig> {
    // grab(grab: "*"): GroqBuilder<ExtractRootScope<TRootConfig["TSchema"]>["*"], TRootConfig>;
    grabOne<TGrabString extends StringKeys<keyof MaybeArrayItem<TScope>>>(
      field: TGrabString
    ): GroqBuilder<
      NonNullable<
        TScope extends Array<infer TScopeItem>
          ? Array<Get<TScopeItem, TGrabString>>
          : Get<TScope, TGrabString>
      >,
      TRootConfig
    >;

    grab<
      TGrab extends (TScope extends Array<infer TScopeItem>
        ? {
            [P in keyof TScopeItem]?: GrabFieldConfig;
          }
        : {
            [P in keyof TScope]?: GrabFieldConfig;
          }) & {
        [P in string]: GrabFieldConfig;
      }
    >(
      grab:
        | TGrab
        | ((q: GroqBuilder<MaybeArrayItem<TScope>, TRootConfig>) => TGrab)
    ): GroqBuilder<
      SimplifyDeep<
        TScope extends Array<infer TScopeItem>
          ? Array<ExtractGrabResult<TScopeItem, TGrab>>
          : ExtractGrabResult<TScope, TGrab>
      >,
      TRootConfig
    >;
  }

  export type GrabFieldConfig = true | Parser<any, any> | GroqBuilder<any, any>;

  export type ExtractGrabResult<TScope, TGrab> = {
    [P in keyof TGrab]: TGrab[P] extends GroqBuilder<
      infer TValue,
      infer TRootConfig
    > // Extract type from GroqBuilder:
      ? TValue
      : /* Extract type from 'true': */
      TGrab[P] extends boolean
      ? P extends keyof TScope
        ? TScope[P]
        : TypeMismatchError<{
            error: `⛔️ 'true' can only be used for known properties ⛔️`;
            expected: keyof TScope;
            actual: P;
          }>
      : /* Extract type from Parser: */
      TGrab[P] extends Parser<infer TInput, infer TOutput>
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
  grabOne(this: GroqBuilder<any, any>, field) {
    return this.extend(`.${field}`, null);
  },
  grab(this: GroqBuilder<any, any>, grab) {
    type TGrab = typeof grab;
    type TKeys = string;
    const keys = Object.keys(grab) as Array<TKeys>;
    let queryFields = [] as string[];
    let parsers = {} as { [P in TKeys]?: Parser<TGrab[P], any> };

    for (const key of keys) {
      const value = grab[key];
      if (typeof value === "boolean") {
        queryFields.push(key);
      } else if (value instanceof GroqBuilder) {
        queryFields.push(key + value.query);
      } else if (
        typeof value === "object" &&
        typeof value.parse === "function"
      ) {
        queryFields.push(key);
        parsers[key] = value;
      } else {
        throw new Error("Unexpected value" + typeof value);
      }
    }

    const newQuery = `{ ${queryFields.join(", ")} }`;
    const newParser = null;
    return this.extend(newQuery, newParser);
  },
});
