import { Override, Simplify } from "./utils";

export type ResultTypeInfo = {
  TItem: unknown;
  IsArray: boolean;
  IsNullable: boolean;
};

export type ResultTypeInfer<T> = {
  TItem: NonNullable<T> extends Array<infer U> ? U : NonNullable<T>;
  IsArray: IsArray<NonNullable<T>>;
  IsNullable: IsNullable<T>;
};

export type ResultTypeOutput<TResult extends ResultTypeInfo> = MakeNullable<
  TResult["IsNullable"],
  MakeArray<TResult["IsArray"], TResult["TItem"]>
>;

/**
 * Overrides the shape of the result, while preserving IsArray and IsNullable
 */
export type ResultOverride<TResult, TResultNew> = Simplify<
  ResultTypeOutput<
    Override<
      ResultTypeInfer<TResult>,
      {
        TItem: NonNullable<TResultNew>;
        IsNullable: IsNullable<TResultNew> extends true
          ? true
          : IsNullable<TResult>;
      }
    >
  >
>;

export type ResultItem<TResult> = ResultTypeOutput<
  Override<ResultTypeInfer<TResult>, { IsArray: false; IsNullable: false }>
>;
export type ResultItemMaybe<TResult> = ResultTypeOutput<
  Override<ResultTypeInfer<TResult>, { IsArray: false }>
>;

type MakeNullable<IsNullable extends boolean, T> = IsNullable extends true
  ? null | T
  : T;
type MakeArray<IsArray extends boolean, T> = IsArray extends true
  ? Array<T>
  : T;
type IsArray<T> = T extends Array<any> ? true : false;
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;
