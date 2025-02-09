/**
 * This file contains utilities for creating "projection paths"
 * from an object type, which can be deeply-nested paths
 * like `images[].asset`
 */
import { IsAny, IsNever, Primitive, Simplify } from "type-fest";
import {
  Empty,
  IsNullable,
  StringKeys,
  UndefinedToNull,
  ValueOf,
} from "./utils";

/**
 * These types are ignored when calculating projection paths,
 * since they're rarely traversed into
 */
export type ProjectionPathIgnoreTypes =
  | Primitive
  | { _type: "reference" }
  | { _type: "block" };

/**
 * Takes a deeply nested object, and returns
 * a flattened map of all possible GROQ projections,
 * with their resulting types
 *
 * @example
 * ProjectionPathEntries<{ foo: Array<{ bar: "BAZ" }> }>
 *   Result:
 *   {
 *     foo: Array<{ bar: "BAZ" }>;
 *     foo[]: Array<{ bar: "BAZ" }>;
 *     foo[].bar: Array<"BAZ">;
 *   }
 */
export type ProjectionPathEntries<Value> = IsAny<Value> extends true
  ? // For <any> types, we just allow any string values:
    Record<string, any>
  : Simplify<UnionToIntersectionFast<_ProjectionPathEntries<Value>>>;

// The actual implementation:
type _ProjectionPathEntries<Value, CurrentPath extends string = ""> =
  // If it's one of these simple types, we don't need to include any entries:
  IsAny<Value> extends true
    ? Empty
    : IsNever<Value> extends true
    ? Empty
    : Value extends ProjectionPathIgnoreTypes
    ? Empty
    : Value extends { _type: "slug" }
    ? Record<`${CurrentPath}.current`, string>
    : // Check for Arrays:
    Value extends Array<infer U>
    ?
        | Record<CurrentPath | `${CurrentPath}[]`, Value>
        | (_ProjectionPathEntries<
            UndefinedToNull<U>,
            `${CurrentPath}[]`
          > extends infer ChildEntries
            ? ValuesAsArrays<ChildEntries>
            : never)
    : // It must be an object; let's map it:
      ValueOf<{
        [Key in StringKeyOf<Value>]:  // Calculate the NewPath:
        `${CurrentPath}${CurrentPath extends ""
          ? ""
          : "."}${Key}` extends infer NewPath extends string
          ? // Include the current entry:

            | Record<NewPath, UndefinedToNull<Value[Key]>>
              // Include all child entries:
              | ValuesAsMaybeNullable<
                  _ProjectionPathEntries<Value[Key], NewPath>,
                  IsNullable<Value[Key]>
                >
          : never;
      }>;

/**
 * This resolves some performance issues with the default UnionToIntersection implementation.
 * Through much trial-and-error, it was discovered that `UnionToIntersection` suffers from major performance issues
 * under the following conditions:
 * - Only happens in the IDE, not at command line
 * - The input type is _moderately_ complex; but not when it's extremely complex
 *
 * By applying `Simplify` first, we eliminate these performance problems!
 */
type UnionToIntersectionFast<U> = UnionToIntersection<Simplify<U>>;

/**
 * Converts a union (|) to an intersection (&).
 * (the implementation by type-fest results in excessive results)
 */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;

type StringKeyOf<T> = Extract<keyof T, string>;
type ValuesAsArrays<T> = {
  [P in keyof T]: Array<T[P]>;
};
type ValuesAsMaybeNullable<
  T,
  ValuesAreNullable extends boolean
> = ValuesAreNullable extends false
  ? T
  : {
      [P in keyof T]: null | T[P];
    };

export type ProjectionPaths<T> = StringKeyOf<ProjectionPathEntries<T>>;

export type ProjectionPathValue<
  T,
  Path extends ProjectionPaths<T>
> = ProjectionPathEntries<T>[Path];

/**
 * Finds the projection paths of T that have an output type compatible with TFilterByType
 */
export type ProjectionPathsByType<
  T,
  TFilterByType,
  _Entries = ProjectionPathEntries<T>
> = ValueOf<{
  [P in keyof _Entries]: TypesAreCompatible<
    _Entries[P],
    TFilterByType
  > extends true
    ? StringKeys<P>
    : never;
}>;

export type TypesAreCompatible<A, B> = A extends B
  ? true
  : B extends A
  ? true
  : false;
