/**
 * This file contains utilities for creating "projection paths"
 * from an object type, which can be deeply-nested paths
 * like `images[].asset`
 */
import {
  IsAny,
  IsNever,
  Primitive,
  Simplify,
  UnionToIntersection,
} from "type-fest";
import { Empty, StringKeys, ValueOf } from "./utils";

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
  : Simplify<_ProjectionPathEntries<Value>>;
// The actual implementation:
type _ProjectionPathEntries<Value, CurrentPath extends string = ""> =
  // If it's one of these simple types, we don't need to include any entries:
  IsAny<Value> extends true
    ? Empty
    : IsNever<Value> extends true
    ? Empty
    : Value extends Primitive
    ? Empty
    : // Check for Arrays:
    Value extends Array<infer U>
    ? Record<CurrentPath | `${CurrentPath}[]`, Value> &
        (_ProjectionPathEntries<
          U,
          `${CurrentPath}[]`
        > extends infer ChildEntries
          ? ValuesAsArrays<ChildEntries>
          : never)
    : // It must be an object; let's map it:
      UnionToIntersection<
        ValueOf<{
          [Key in StringKeyOf<Value>]:  // Calculate the NewPath:
          `${CurrentPath}${CurrentPath extends ""
            ? ""
            : "."}${Key}` extends infer NewPath extends string
            ? // Include the current entry:
              Record<NewPath, Value[Key]> &
                // Include all child entries:
                _ProjectionPathEntries<MaybeOptional<Value[Key]>, NewPath>
            : never;
        }>
      >;

type StringKeyOf<T> = Extract<keyof T, string>;
type ValuesAsArrays<T> = {
  [P in keyof T]: Array<T[P]>;
};
/**
 * If `T` is optional, then make all its properties optional instead:
 */
type MaybeOptional<T> = IsAny<T> extends false
  ? undefined extends T
    ? Partial<NonNullable<T>>
    : T
  : T;

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
