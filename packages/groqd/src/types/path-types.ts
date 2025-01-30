// Source: https://github.com/toonvanstrijp/nestjs-i18n/blob/1a86bb46e9386c6450d10c9c9e609f78315752d0/src/types.ts

import { ValueOf } from "./utils";

/**
 * Extracts all deep paths of nested types.
 *
 * @example
 * type Keys = Path<{ a: { b: { c: "C" } } }>;
 * // Keys = "a" | "a.b" | "a.b.c"
 */
export type Path<T> = keyof T extends string
  ? PathImpl2<T> extends infer P
    ? P extends string | keyof T
      ? P
      : keyof T
    : keyof T
  : never;

/**
 * Extracts the value of a deep path.
 *
 * @example
 * type Val = PathValue<{ a: { b: { c: "C" } } }, "a.b.c">;
 * // Val = "C";
 */
export type PathValue<
  T,
  P extends Path<T>
> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Returns a deeply-flattened type
 * @example
 * PathEntries<{ a: { b: "C" } }> === { a: { b: "C" }, "a.b": "C" }
 */
export type PathEntries<TResultItem> = {
  [P in Path<TResultItem>]: PathValue<TResultItem, P>;
};

/**
 * Returns all keys that match the specified type.
 *
 * @example
 * PathKeysWithType<{ a: { b: "B", c: 3 }, d: 4}, number> === "a.c" | "d"
 */
export type PathKeysWithType<
  TResultItem,
  TFilterByType,
  _Entries = PathEntries<TResultItem>
> = ValueOf<{
  [P in keyof _Entries]: _Entries[P] extends TFilterByType
    ? P
    : TFilterByType extends _Entries[P]
    ? P
    : never;
}>;

type IsAny<T> = unknown extends T
  ? [keyof T] extends [never]
    ? false
    : true
  : false;

type PathImpl<T, Key extends keyof T> = Key extends string
  ? IsAny<T[Key]> extends true
    ? never
    : T[Key] extends Record<string, any>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> &
            string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;
