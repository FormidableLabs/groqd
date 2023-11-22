import { Simplify } from "./utils";

export type ResultType<
  TItem = any,
  IsArray extends boolean = any,
  IsNullable extends boolean = any
> = {
  TItem: TItem;
  IsArray: IsArray;
  IsNullable: IsNullable;
};

export type ResultOverride<
  TResult extends ResultType,
  TOverrides extends Partial<ResultType>
> = Simplify<TOverrides & Omit<TResult, keyof TOverrides>>;

export type ResultTypeInfer<TResult extends ResultType> = MakeNullable<
  TResult["IsNullable"],
  MakeArray<TResult["IsArray"], TResult["TItem"]>
>;

type MakeNullable<IsNullable extends boolean, T> = IsNullable extends true
  ? null | T
  : T;
type MakeArray<IsArray extends boolean, T> = IsArray extends true
  ? Array<T>
  : T;
