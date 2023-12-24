import {
  ExtractProjectionResult,
  ProjectionMap,
  ProjectionMapOrCallback,
} from "./projection-types";
import { Empty, Simplify, Tagged, ValueOf } from "../types/utils";
import { ExtractTypeNames, RootConfig } from "../types/schema-types";

export type ConditionalProjections<TResultItem> = {
  [Condition in ConditionalExpression<TResultItem>]: ProjectionMap<TResultItem>;
};

export type ConditionalExpression<TResultItem> = Tagged<string, TResultItem>;

export type WrapConditionalProjectionResults<
  TResultItem,
  TConditionalProjections extends ConditionalProjections<any>
> = ConditionalProjectionResultWrapper<
  ValueOf<{
    [Condition in keyof TConditionalProjections]: Simplify<
      ExtractProjectionResult<TResultItem, TConditionalProjections[Condition]>
    >;
  }>
>;

declare const ConditionalProjectionResultTypes: unique symbol;
export type ConditionalProjectionResultWrapper<TResultTypes> = {
  [ConditionalProjectionResultTypes]: TResultTypes;
};

export type ExtractConditionalProjectionTypes<TResultItem> =
  TResultItem extends ConditionalProjectionResultWrapper<infer TResultTypes>
    ? TResultTypes
    : Empty;

export type ConditionalByTypeProjections<
  TResultItem,
  TRootConfig extends RootConfig
> = {
  [_type in ExtractTypeNames<TResultItem>]: ProjectionMapOrCallback<
    TResultItem,
    TRootConfig
  >;
};

export type ExtractConditionalByTypeProjectionResults<
  TConditionalProjections extends ConditionalByTypeProjections<any, any>
> = TConditionalProjections extends ConditionalByTypeProjections<
  infer TResultItem,
  any
>
  ? ConditionalProjectionResultWrapper<
      ValueOf<{
        [_type in keyof TConditionalProjections]: TConditionalProjections[_type] extends ProjectionMapOrCallback<
          infer TProjectionMap,
          any
        >
          ? ExtractProjectionResult<TResultItem, TProjectionMap>
          : never;
      }>
    >
  : never;
