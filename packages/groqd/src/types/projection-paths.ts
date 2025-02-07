import {
  IsAny,
  IsNever,
  Primitive,
  Simplify,
  UnionToIntersection,
} from "type-fest";
import { Empty, ValueOf } from "./utils";

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
export type ProjectionPathEntries<Value> = Simplify<
  _ProjectionPathEntries<Value>
>;
// The actual implementation:
type _ProjectionPathEntries<
  Value,
  CurrentPath extends string = ""
> = (CurrentPath extends "" ? Empty : Record<CurrentPath, Value>) &
  (IsAny<Value> extends true
    ? Empty
    : IsNever<Value> extends true
    ? Empty
    : Value extends Primitive
    ? Empty
    : Value extends Array<infer U>
    ? _ProjectionPathEntries<U, `${CurrentPath}[]`> extends infer _ArrayNested
      ? ValuesAsArrays<_ArrayNested>
      : never
    : UnionToIntersection<
        ValueOf<{
          [Key in StringKeyOf<Value>]: _ProjectionPathEntries<
            Value[Key],
            `${CurrentPath}${CurrentPath extends "" ? "" : "."}${Key}`
          >;
        }>
      >);

type StringKeyOf<T> = Extract<keyof T, string>;
export type ValuesAsArrays<T> = {
  [P in keyof T]: Array<T[P]>;
};

export type ProjectionPaths<T> = keyof ProjectionPathEntries<T>;

export type ProjectionPathValue<
  T,
  Path extends keyof ProjectionPathEntries<T>
> = ProjectionPathEntries<T>[Path];

export type ProjectionPathsByType<
  T,
  TFilterByType,
  _Entries = ProjectionPathEntries<T>
> = ValueOf<{
  [P in keyof _Entries]: _Entries[P] extends TFilterByType
    ? P
    : TFilterByType extends _Entries[P]
    ? P
    : never;
}>;
