import { IsAny, Primitive } from "type-fest";
import { ValueOf } from "./utils";

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

export type ProjectionPathValue<T, Path extends ProjectionPaths<T>> = never;

export type ProjectionPathEntries<T> = {
  [P in ProjectionPaths<T>]: ProjectionPathValue<T, P>;
};

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
