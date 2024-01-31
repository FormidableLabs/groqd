import type { Simplify } from "type-fest";

export type { Simplify, Primitive, LiteralUnion, IsAny } from "type-fest";

/**
 * Extracts the key from the object type, same as TObj[TKey]
 * If the key doesn't exist, returns a TypeMismatchError
 */
export type Get<TObj, TKey> = TKey extends keyof TObj
  ? TObj[TKey]
  : TypeMismatchError<{
      error: "Invalid property";
      expected: keyof TObj;
      actual: TKey;
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

export type TypeMismatchError<
  TError extends { error: string; expected: any; actual: any } = any
> = {
  error: TError["error"];
  expected: Simplify<TError["expected"]>;
  actual: Simplify<TError["actual"]>;
};

/**
 * Extracts all TypeMismatchError's from the projection result,
 * making it easy to report these errors.
 * Returns `never` if there are no errors.
 */
export type ExtractTypeMismatchErrors<TProjectionResult> = ValueOf<{
  [TKey in StringKeys<
    keyof TProjectionResult
  >]: TProjectionResult[TKey] extends TypeMismatchError
    ? `Error in "${TKey}": ${TProjectionResult[TKey]["error"]}`
    : never;
}>;

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

/**
 * Replaces undefined with null.
 * @example
 * UndefinedToNull<Foo | undefined> == Foo | null;
 * UndefinedToNull<Foo> == Foo;
 */
export type UndefinedToNull<T> = T extends undefined
  ? NonNullable<T> | null
  : T;
