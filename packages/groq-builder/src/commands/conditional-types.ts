import {
  ExtractProjectionResult,
  ProjectionMap,
  ProjectionMapOrCallback,
} from "./projection-types";
import { Empty, Simplify, Tagged, ValueOf } from "../types/utils";
import { ExtractTypeNames, RootConfig } from "../types/schema-types";
import { GroqBuilder } from "../groq-builder";

export type ConditionalProjections<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [Condition: ConditionalExpression<TResultItem>]:
    | ProjectionMap<TResultItem>
    | ((
        q: GroqBuilder<TResultItem, TRootConfig>
      ) => ProjectionMap<TResultItem>);
};

export type ConditionalExpression<TResultItem> = Tagged<string, TResultItem>;

export type WrapConditionalProjectionResults<
  TResultItem,
  TConditionalProjections extends ConditionalProjections<any, any>
> = ConditionalProjectionResultWrapper<
  ValueOf<{
    [Condition in keyof TConditionalProjections]: Simplify<
      ExtractProjectionResult<TResultItem, TConditionalProjections[Condition]>
    >;
  }>
>;

export declare const ConditionalProjectionResultTypesTag: unique symbol;
export type ConditionalProjectionResultWrapper<TResultTypes> = {
  readonly [ConditionalProjectionResultTypesTag]?: TResultTypes;
};

export type ExtractConditionalProjectionTypes<TResultItem> =
  TResultItem extends ConditionalProjectionResultWrapper<infer TResultTypes>
    ? TResultTypes
    : Empty;

export type ConditionalByTypeProjections<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [_type in ExtractTypeNames<TResultItem>]?: ProjectionMapOrCallback<
    Extract<TResultItem, { _type: _type }>,
    TRootConfig
  >;
};

export type WrapConditionalByTypeProjectionResults<
  TResultItem,
  TConditionalProjections extends ConditionalByTypeProjections<any, any>
> = ConditionalProjectionResultWrapper<
  Simplify<
    | Empty
    | ValueOf<{
        [_type in keyof TConditionalProjections]: TConditionalProjections[_type] extends (
          q: any
        ) => infer TProjectionMap
          ? ExtractProjectionResult<
              Extract<TResultItem, { _type: _type }>,
              TProjectionMap
            >
          : ExtractProjectionResult<
              Extract<TResultItem, { _type: _type }>,
              TConditionalProjections[_type]
            >;
      }>
  >
>;
