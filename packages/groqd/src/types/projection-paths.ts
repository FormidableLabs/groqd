import { IsAny, Primitive, Simplify, UnionToIntersection } from "type-fest";
import { Empty, ValueOf } from "./utils";

export type ProjectionPaths<T> = PathImpl<T>;

type PathImpl<
  Value,
  Connector extends string = ""
  // Key extends Extract<keyof Type, string> = Extract<keyof Type, string>,
  // Value extends Type[Key] = Type[Key]
> = IsAny<Value> extends true
  ? ""
  : Value extends Primitive
  ? ""
  : Value extends Array<infer U>
  ? "[]" | `[]${PathImpl<U, ".">}`
  : ValueOf<{
      [Key in Extract<keyof Value, string>]:
        | `${Connector}${Key}`
        | `${Connector}${Key}${PathImpl<Value[Key], ".">}`;
    }>;

/*











 */
export type ProjectionPathEntries<Value> = Simplify<
  _ProjectionPathEntries<Value>
>;

export type _ProjectionPathEntries<
  Value,
  CurrentPath extends string = ""
> = (CurrentPath extends "" ? Empty : Record<CurrentPath, Value>) &
  (IsAny<Value> extends true
    ? Empty
    : Value extends Primitive
    ? Empty
    : Value extends Array<infer U>
    ? _ProjectionPathEntries<U, `${CurrentPath}[]`> extends infer ArrayNested
      ? ValuesAsArrays<ArrayNested>
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
/*









 */
export type ProjectionPathValue<T, Path extends ProjectionPaths<T>> = never;

// export type ProjectionPathEntries<T> = {
//   [P in ProjectionPaths<T>]: ProjectionPathValue<T, P>;
// };
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
