import { MaybeArrayItem, Simplify } from "./utils";

export type ResultTypeUnknown = {
  TItem: unknown;
  IsArray: boolean;
  IsNullable: boolean;
};
export type ResultType<T extends ResultTypeUnknown = ResultTypeUnknown> = T;

export type ResultOverride<
  TResult extends ResultTypeUnknown,
  TOverrides extends Partial<ResultTypeUnknown>
> = Simplify<TOverrides & Omit<TResult, keyof TOverrides>>;

export type ResultTypeInfer<T> = Simplify<
  ResultType<{
    TItem: MaybeArrayItem<T>;
    IsArray: IsArray<NonNullable<T>>;
    IsNullable: IsNullable<T>;
  }>
>;

export type ResultTypeOutput<TResult extends ResultTypeUnknown> = MakeNullable<
  TResult["IsNullable"],
  MakeArray<TResult["IsArray"], TResult["TItem"]>
>;

type MakeNullable<IsNullable extends boolean, T> = IsNullable extends true
  ? null | T
  : T;
type MakeArray<IsArray extends boolean, T> = IsArray extends true
  ? Array<T>
  : T;
type IsArray<T> = T extends Array<any> ? true : false;
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;
