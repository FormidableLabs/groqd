import { Override, Simplify } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ResultItem {
  export type Infer<TResult> = InferResultItem<TResult>;
  export type InferMaybe<TResult> = InferResultItemMaybe<TResult>;
  export type Override<TResult, TResultItemNew> = OverrideResultItem<
    TResult,
    TResultItemNew
  >;
}

/**
 * The results of a query can be a single item or an array of items,
 * and often the results are nullable.
 *
 * Most chainable methods need to "unwrap" this type,
 * to see what the inner "ResultItem" looks like
 * (ignoring IsNullable and IsArray).
 *
 * Then, the method needs to "rewrap" a new type,
 * while preserving the IsNullable and IsArray.
 */
type ResultTypeUnwrapped = {
  TResultItem: unknown;
  IsArray: boolean;
  IsNullable: boolean;
};

/**
 *
 * @internal Only exported for tests
 */
export type InferResultDetails<TResult> = {
  TResultItem: NonNullable<TResult> extends Array<infer U>
    ? U
    : NonNullable<TResult>;
  IsArray: IsArray<NonNullable<TResult>>;
  IsNullable: IsNullable<TResult>;
};

/**
 * @internal Only exported for tests
 */
export type InferFromResultDetails<TDetails extends ResultTypeUnwrapped> =
  MakeNullable<
    TDetails["IsNullable"],
    MakeArray<
      //
      TDetails["IsArray"],
      TDetails["TResultItem"]
    >
  >;

/**
 * Overrides the shape of the result, while preserving IsArray and IsNullable
 *
 * @example
 * OverrideResultItem<null | Array<"FOO">, "BAR">;  // Result: null | Array<"BAR">
 * OverrideResultItem<Array<"FOO">, "BAR">;         // Result: Array<"BAR">
 * OverrideResultItem<null | "FOO", "BAR">;         // Result: null | "BAR"
 * OverrideResultItem<"FOO", "BAR">;                // Result: "BAR"
 */
export type OverrideResultItem<TResult, TResultItemNew> = Simplify<
  InferFromResultDetails<
    Override<
      InferResultDetails<TResult>,
      {
        TResultItem: NonNullable<TResultItemNew>;
        IsNullable: IsNullable<TResultItemNew> extends true
          ? true
          : IsNullable<TResult>;
      }
    >
  >
>;

export type InferResultItem<TResult> = InferFromResultDetails<
  Override<InferResultDetails<TResult>, { IsArray: false; IsNullable: false }>
>;
export type InferResultItemMaybe<TResult> = InferFromResultDetails<
  Override<InferResultDetails<TResult>, { IsArray: false }>
>;

// Internal utils:
type MakeNullable<IsNullable extends boolean, T> = IsNullable extends true
  ? null | T
  : T;
type MakeArray<IsArray extends boolean, T> = IsArray extends true
  ? Array<T>
  : T;
type IsArray<T> = T extends Array<any> ? true : false;
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;
