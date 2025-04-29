import { TypeMismatchError } from "./type-mismatch-error";
import { UnionToIntersection } from "type-fest";

export type { Simplify, Primitive, LiteralUnion, IsAny } from "type-fest";

/**
 * Extracts the key from the object type, same as TObj[TKey]
 * If the key doesn't exist, returns a TypeMismatchError
 */
export type Get<TObj, TKey> = TKey extends keyof TObj
  ? TObj[TKey]
  : TypeMismatchError<{
      error: "Invalid property";
      actual: TKey;
      expected: keyof TObj;
    }>;

/**
 * Simplifies a type alias to just the primitive types.
 * Improves IDE experience.
 * @example
 * type Nested = { nested: "NESTED" };
 * type Foo = Partial<{ a: "A", b: "B", nested: Nested }>;
 *
 * type FooSimple = SimplifyDeep<Foo>;
 * // Shows as "type fooSimple = { a?: "A", b?: "B", nested?: {nested: "NESTED" } }"
 */
export type SimplifyDeep<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: SimplifyDeep<O[K]> }
    : never
  : T;

export type Override<T, TOverrides> = Omit<T, keyof TOverrides> & TOverrides;

/**
 * Returns a union of all value types in the object
 */
export type ValueOf<T> = T[keyof T];
/**
 * Returns a union of the [Key, Value] pairs of the object.
 * @example
 *  EntriesOf<{ foo: "FOO", bar: "BAR" }>
 *  // Results: ["foo", "FOO"] | ["bar", "BAR"]
 */
export type EntriesOf<T> = ValueOf<{
  [Key in StringKeys<keyof T>]: [Key, T[Key]];
}>;

/**
 * Returns the intersection (&) of the values of a type.
 *
 * Similar to ValueOf, which returns the union (|) of the values.
 *
 * @example
 * IntersectionOfValues<{
 *   foo: { foo: "FOO" } | { },
 *   bar: { bar: "BAR" } | { },
 * }> == { } | { foo: "FOO" } | { bar: "BAR" } | { foo: "FOO", bar: "BAR" }
 */
export type IntersectionOfValues<T> = {
  [P in keyof T]: (x: T[P]) => void;
}[keyof T] extends (x: infer ValueIntersection) => void
  ? ValueIntersection
  : never;

/**
 * Excludes symbol and number from keys, so that you only have strings.
 */
export type StringKeys<T> = Exclude<T, symbol | number>;
export type ExtractString<T> = Extract<T, string>;

/**
 * Excludes the first item in a tuple
 */
export type ButFirst<T extends Array<any>> = T extends [any, ...infer Rest]
  ? Rest
  : never;

/**
 * A completely empty object.
 */
export type Empty = Record<never, never>;

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<Extract<keyof T, string>>;
}

export function notNull<T>(value: T | null): value is T {
  return !!value;
}

export function pick<T, TKeys extends keyof T>(
  obj: T,
  keys: TKeys[]
): Pick<T, TKeys> {
  const res = {} as Pick<T, TKeys>;
  for (const key of keys) {
    res[key] = obj[key];
  }
  return res;
}

/**
 * Replaces undefined with null.
 * @example
 * UndefinedToNull<Foo | undefined> == Foo | null;
 * UndefinedToNull<Foo> == Foo;
 */
export type UndefinedToNull<T> = T extends undefined
  ? NonNullable<T> | null
  : T;

/**
 * Returns true if T can be null | undefined
 */
export type IsNullable<T> = null extends T
  ? true
  : undefined extends T
  ? true
  : false;

/**
 * Makes a type nullable
 */
export type MakeNullable<
  IsNullable extends boolean,
  T
> = IsNullable extends true ? null | T : T;

/**
 * Returns just one type from a union of types.
 *
 * Note: ⚠️ the order is determined by compiler internals, and is NOT very stable!  Tread carefully!
 *
 * @example
 * JustOneOf<'a' | 'b' | 'c'> === 'c' (probably)
 * JustOneOf<1 | 2> === 1 (probably)
 */
export type JustOneOf<TUnion> = UnionToIntersection<
  TUnion extends any ? () => TUnion : never
> extends () => infer R
  ? R
  : never;

/**
 * TSGenerics doesn't provide a way to create variables.
 * This utility adds a way to create a variable.
 * @example
 * type Example<T> =
 *   // Create a variable using this "extends infer" approach:
 *   Variable<{ foo: T, bar: T, baz: T }> extends infer FooBarBaz
 *   // Now you can use the FooBarBaz variable:
 *   ? FooBarBaz
 *   : never;
 */
export type Variable<T> = T;
