import { Override, Simplify } from "./utils";

export type ResultTypeUnknown = unknown;

export type ResultTypeInfo = {
  TItem: unknown;
  IsArray: boolean;
  IsNullable: boolean;
};

export type ResultType<T extends ResultTypeInfo> = T;

export type ResultTypeInfer<T> = {
  TItem: NonNullable<T> extends Array<infer U> ? U : NonNullable<T>;
  IsArray: IsArray<NonNullable<T>>;
  IsNullable: IsNullable<T>;
};

export type ResultTypeOutput<TResult extends ResultTypeInfo> = MakeNullable<
  TResult["IsNullable"],
  MakeArray<TResult["IsArray"], TResult["TItem"]>
>;

export type ResultOverrideItem<
  TResult extends ResultTypeUnknown,
  TOverrides extends { TItem: unknown }
> = Simplify<
  ResultTypeOutput<
    Override<ResultTypeInfer<TResult>, { TItem: TOverrides["TItem"] }>
  >
>;
export type ResultOverrideArray<
  TResult extends ResultTypeUnknown,
  TOverrides extends { IsArray: boolean }
> = Simplify<
  ResultTypeOutput<
    Override<ResultTypeInfer<TResult>, { IsArray: TOverrides["IsArray"] }>
  >
>;

type MakeNullable<IsNullable extends boolean, T> = IsNullable extends true
  ? null | T
  : T;
type MakeArray<IsArray extends boolean, T> = IsArray extends true
  ? Array<T>
  : T;
type IsArray<T> = T extends Array<any> ? true : false;
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;
