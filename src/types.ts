import { z } from "zod";
import { BaseQuery } from "./builder";

export type ValueOf<T> = T[keyof T];

export type InferType<P> = P extends BaseQuery<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;

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
