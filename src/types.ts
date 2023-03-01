import { z } from "zod";
import { BaseQuery } from "./builder";

export type ValueOf<T> = T[keyof T];

export type InferType<P> = P extends BaseQuery<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : P extends z.ZodType
  ? z.infer<P>
  : never;

/**
 * Type from selection, useful if defining conditional selections in a separate file
 *   and you want the type that you'll get from that.
 */
export type TypeFromSelection<Sel extends Selection> = z.infer<
  FromSelection<Sel>
>;

/**
 * Helper to determine if list of values includes a value,
 *   used in sanityImage
 */
export type ListIncludes<T, M> = T extends any[]
  ? ArrayToObj<T> extends FieldToObj<M>
    ? true
    : false
  : false;

type ArrayToObj<T extends any[]> = {
  [K in T[number]]: true;
};
type FieldToObj<T> = {
  [K in T & string]: { [Key in K]: true };
}[T & string];

/**
 * Misc internal utils
 */

type Field<T extends z.ZodType> = T;
type FromField<T> = T extends Field<infer R>
  ? R
  : T extends [string, infer R]
  ? R
  : never;
export type FromSelection<Sel extends Selection> = z.ZodObject<{
  [K in keyof Sel]: Sel[K] extends BaseQuery<any>
    ? Sel[K]["schema"]
    : FromField<Sel[K]>;
}>;

export type Selection = Record<
  string,
  BaseQuery<any> | z.ZodType | [string, z.ZodType]
>;
