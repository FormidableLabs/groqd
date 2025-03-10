import { QueryConfig } from "../../types/query-config";
import { StringKeys, ValueOf } from "../../types/utils";
import { GroqBuilderSubquery } from "../../groq-builder";
import { Expressions } from "../../types/groq-expressions";
import { ExtractDocumentTypes } from "../../types/document-types";
import { IGroqBuilder, InferResultType } from "../../groq-builder";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SelectProjections<
  TResultItem,
  TQueryConfig extends QueryConfig
> = Partial<
  Record<Expressions.AnyConditional<TResultItem, TQueryConfig>, IGroqBuilder>
>;

export type ExtractSelectResult<
  TSelectProjections extends SelectProjections<any, any>
> = ValueOf<{
  [P in StringKeys<keyof TSelectProjections>]: InferResultType<
    NonNullable<TSelectProjections[P]>
  >;
}>;

export type SelectByTypeProjections<
  TResultItem,
  TQueryConfig extends QueryConfig
> = {
  [_type in ExtractDocumentTypes<TResultItem>]?:
    | IGroqBuilder
    | ((
        sub: GroqBuilderSubquery<
          Extract<TResultItem, { _type: _type }>,
          TQueryConfig
        >
      ) => IGroqBuilder);
};

export type ExtractSelectByTypeResult<
  TSelectProjections extends SelectByTypeProjections<any, any>
> = ValueOf<{
  [_type in keyof TSelectProjections]: TSelectProjections[_type] extends IGroqBuilder<
    infer TResult
  >
    ? TResult
    : TSelectProjections[_type] extends (q: any) => IGroqBuilder<infer TResult>
    ? TResult
    : never;
}>;
