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
import { CompatibleKeys, CompatiblePick } from "./compatible-types";

/**
 * These types are ignored when calculating projection paths,
 * since they're rarely traversed into.
 *
 * This interface is extensible, if you want to add your
 * own shallow types.
 */
export interface ProjectionPathShallowTypes {
  "reference blocks": { _type: "reference" };
  "portable text blocks": { _type: "block" };
}

type ShouldBeShallow<Value, CurrentPath> =
  // When at the top-level, we should allow deep nesting:
  CurrentPath extends ""
    ? false
    : // These types should not be deeply-traversed:
    NonNullable<Value> extends ValueOf<ProjectionPathShallowTypes>
    ? true
    : false;

/**
 * These simple types are shallow, and do not need to
 * include any deeper entries.
 */
type IsSimpleType<Value> = IsAny<Value> extends true
  ? true
  : IsNever<Value> extends true
  ? true
  : Value extends Primitive
  ? true
  : false;

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
      UnionToIntersectionFast<_ProjectionPathEntries<"", SimplifyUnion<Value>>>
    >;

// The actual implementation:
type _ProjectionPathEntries<
  CurrentPath extends string,
  Value
> = IsSimpleType<Value> extends true
  ? never
  : ShouldBeShallow<Value, CurrentPath> extends true
  ? never
  : // Don't go deep for the self-selector "@":
  CurrentPath extends "@"
  ? never
  : // Only show "slug.current":
  Value extends { _type: "slug" }
  ? Record<JoinPath<CurrentPath, "current">, string>
  : // Check for Arrays:
  Value extends Array<infer U>
  ?
      | Record<`${CurrentPath}[]`, Value>
      | (_ProjectionPathEntries<
          `${CurrentPath}[]`,
          UndefinedToNull<U>
        > extends infer ChildEntries
          ? ValuesAsArrays<ChildEntries>
          : never)
  : // It must be an object; let's map it:
    ValueOf<{
      [Key in StringKeys<keyof Value>]:
        | (IsArray<Value[Key]> extends true
            ? never // We want arrays to require the `[]`
            : // Include an entry for the current item:
              Record<JoinPath<CurrentPath, Key>, UndefinedToNull<Value[Key]>>)

        // Include all nested entries:
        | ValuesAsMaybeNullable<
            _ProjectionPathEntries<
              JoinPath<CurrentPath, Key>,
              UndefinedToNull<Value[Key]>
            >,
            IsNullable<Value[Key]>
          >;
    }>;

type JoinPath<
  CurrentPath extends string,
  Key extends string
> = `${CurrentPath}${CurrentPath extends "" ? "" : "."}${Key}`;
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

type IsArray<T> = IsAny<T> extends true
  ? false
  : Array<any> extends T
  ? true
  : false;

/**
 * Retrieves all projection paths for the given T
 */
export type ProjectionPaths<T> = StringKeys<keyof ProjectionPathEntries<T>>;

/**
 * Retrieves the value yielded by the Path
 */
export type ProjectionPathValue<
  T,
  Path extends ProjectionPaths<T>
> = ProjectionPathEntries<T>[Path];

/**
 * Finds the projection paths of T
 * that have an output type compatible with TFilterByType
 */
export type ProjectionPathsByType<T, TFilterByType> = StringKeys<
  CompatibleKeys<ProjectionPathEntries<T>, TFilterByType>
>;

/**
 * Finds the projection path entries of T
 * that have an output type compatible with TFilterByType
 */
export type ProjectionPathEntriesByType<T, TFilterByType> = CompatiblePick<
  ProjectionPathEntries<T>,
  TFilterByType
>;
