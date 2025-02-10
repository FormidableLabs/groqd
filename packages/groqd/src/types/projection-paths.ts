/**
 * This file contains utilities for creating "projection paths"
 * from an object type, which can be deeply-nested paths
 * like `images[].asset`
 */
import { IsAny, IsNever, Primitive, Simplify } from "type-fest";
import { IsNullable, StringKeys, UndefinedToNull, ValueOf } from "./utils";
import {
  SimplifyUnion,
  UnionToIntersectionFast,
} from "./union-to-intersection";

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
  : Simplify<
      UnionToIntersectionFast<_ProjectionPathEntries<SimplifyUnion<Value>>>
    >;

// The actual implementation:
type _ProjectionPathEntries<Value, CurrentPath extends string = ""> =
  // If it's one of these simple types, we don't need to include any entries:
  IsAny<Value> extends true
    ? never
    : IsNever<Value> extends true
    ? never
    : Value extends ProjectionPathIgnoreTypes
    ? never
    : Value extends { _type: "slug" }
    ? Record<JoinPath<CurrentPath, "current">, string>
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
        // Calculate the NewPath:
        [Key in StringKeyOf<Value>]:  // Include the current entry:
          | Record<JoinPath<CurrentPath, Key>, UndefinedToNull<Value[Key]>>
          // Include all child entries:
          | ValuesAsMaybeNullable<
              _ProjectionPathEntries<Value[Key], JoinPath<CurrentPath, Key>>,
              IsNullable<Value[Key]>
            >;
      }>;

type JoinPath<
  CurrentPath extends string,
  Key extends string
> = `${CurrentPath}${CurrentPath extends "" ? "" : "."}${Key}`;
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
> = StringKeys<
  ValueOf<{
    [P in keyof _Entries]: TypesAreCompatible<
      _Entries[P],
      TFilterByType
    > extends true
      ? P
      : never;
  }>
>;

export type TypesAreCompatible<A, B> = A extends B
  ? true
  : B extends A
  ? true
  : false;
