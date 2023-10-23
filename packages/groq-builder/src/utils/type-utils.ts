/**
 * All primitive types; just not objects or functions.
 */
export type Primitive = number | string | boolean | null | undefined | symbol;

/**
 * Extracts the key from the object type, same as TObj[TKey[
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

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = { [P in keyof T]: T[P] } & {};

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type Override<T, TOverrides> = Omit<T, keyof TOverrides> & TOverrides;

/**
 * Extracts the type of an array item, if the type is indeed an array.
 */
export type MaybeArrayItem<T> = T extends Array<infer TItem> ? TItem : T;
/**
 * Extracts the type of an array item; returns an error if it's not an array.
 */
export type ArrayItem<T> = T extends Array<infer TItem>
  ? TItem
  : TypeMismatchError<{
      error: "Expected an array";
      expected: Array<any>;
      actual: T;
    }>;

export type TypeMismatchError<
  TError extends { error: string; expected: any; actual: any }
> = {
  error: TError["error"];
  expected: TError["expected"];
  actual: TError["actual"];
};
