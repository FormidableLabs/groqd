import { IsNullable, MakeNullable, Override as _Override } from "./utils";

/* eslint-disable @typescript-eslint/no-namespace */

/**
 * The results of a query can be a single item, or an array of items,
 * and the results can be nullable too.
 *
 * However, most chainable methods need to look at the shape
 * of the inner "ResultItem", ignoring the nullable and Array wrappers.
 * You can do this with `ResultItem.Infer<TResult>`.
 *
 * Additionally, these methods might need to rewrap a new type,
 * while preserving the nullable/Array wrappers.
 * You can do this with `ResultItem.Override<TResult, TResultItemNew>`
 */
export namespace ResultItem {
  /**
   * Retrieves just the shape of the TResult, unwrapping nulls and arrays.
   *
   * @example
   * Infer<"FOO">               // Result: "FOO"
   * Infer<Array<"FOO">>        // Result: "FOO"
   * Infer<null | "FOO">        // Result: "FOO"
   * Infer<null | Array<"FOO">> // Result: "FOO"
   * Infer<null | Array<null | "FOO">> // Result: "FOO"
   */
  export type Infer<TResult> = ResultUtils.Unwrap<TResult>["TResultItem"];

  /**
   * Retrieves just the shape of the TResult, unwrapping arrays.
   *
   * Preserves nulls.
   *
   * @example
   * Infer<"FOO">               // Result: "FOO"
   * Infer<Array<"FOO">>        // Result: "FOO"
   * Infer<null | "FOO">        // Result: null | "FOO"
   * Infer<null | Array<"FOO">> // Result: null | "FOO"
   */
  export type InferMaybe<TResult> = ResultUtils.Wrap<
    _Override<
      ResultUtils.Unwrap<TResult>,
      // Keep the "IsNullable" flag, but unwrap the array:
      { IsArray: false }
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
  export type Override<TResult, TResultItemNew> = ResultUtils.Wrap<
    _Override<
      ResultUtils.Unwrap<TResult>,
      {
        TResultItem: TResultItemNew;
      }
    >
  >;
}

/**
 * This namespace provides utilities for unwrapping
 * and re-wrapping the null/Array types.
 *
 * @internal Only exported for tests
 */
export namespace ResultUtils {
  export type Unwrapped = {
    TResultItem: unknown;
    IsArray: boolean;
    IsNullable: boolean;
  };
  export type Unwrap<TResult> = {
    TResultItem: NonNullable<TResult> extends Array<infer U>
      ? NonNullable<U>
      : NonNullable<TResult>;
    IsArray: IsArray<NonNullable<TResult>>;
    IsNullable: IsNullable<TResult>;
  };
  export type Wrap<TDetails extends Unwrapped> = MakeNullable<
    TDetails["IsNullable"],
    MakeArray<
      //
      TDetails["IsArray"],
      TDetails["TResultItem"]
    >
  >;

  // Internal utils:
  type MakeArray<IsArray extends boolean, T> = IsArray extends true
    ? Array<T>
    : T;
  type IsArray<T> = T extends Array<any> ? true : false;
}
