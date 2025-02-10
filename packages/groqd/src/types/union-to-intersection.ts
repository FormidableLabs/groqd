import { Simplify } from "type-fest";

/**
 * Converts a union (|) into an intersection (&);
 * only keeps the common keys.
 *
 * @example
 * SimplifyUnion<
 *  | { _type: "TypeA", a: "A" }
 *  | { _type: "TypeB", a: "B" }
 * > == {
 *   _type: "TypeA" | "TypeB"
 * }
 */
export type SimplifyUnion<T> = Pick<T, keyof T>;

/**
 * Converts a union (|) to an intersection (&);
 * all keys from all unions are kept intact, and either combined or made optional
 * @example
 * Combine<
 *   | { _type: "TypeA", a: "A" }
 *   | { _type: "TypeB", b: "B" }
 * > => {
 *   _type: "TypeA" | "TypeB";
 *   a?: "A";
 *   b?: "B";
 * }
 */
export type Combine<T> = { [K in keyof _Combine<T>]: _Combine<T>[K] };
type _Combine<
  T,
  // Calculate all possible keys:
  K extends PropertyKey = T extends unknown ? keyof T : never
> = T extends unknown // (makes sure we map each union separately)
  ? // Extend each T with all missing keys:
    T & Partial<Record<Exclude<K, keyof T>, never>>
  : never;

/**
 * This resolves some performance issues with the default UnionToIntersection implementation.
 * Through much trial-and-error, it was discovered that `UnionToIntersection` suffers from major performance issues
 * under the following conditions:
 * - Only happens in the IDE, not at command line
 * - The input type is _moderately_ complex; but not when it's extremely complex
 *
 * By applying `Simplify` first, we eliminate these performance problems!
 */
export type UnionToIntersectionFast<U> = UnionToIntersection<Simplify<U>>;
/**
 * Converts a union (|) to an intersection (&).
 * (note: the implementation by type-fest results in excessive results)
 */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;
