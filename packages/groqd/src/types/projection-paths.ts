import { IsAny, Primitive } from "type-fest";
import { ValueOf } from "./utils";

export type ProjectionPaths<TItem> = PathImpl<TItem>;

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
