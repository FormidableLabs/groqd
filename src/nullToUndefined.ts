import { preprocess, z } from "zod";
import { Selection } from "./grab";

export const _nullToUndefined = <T extends z.ZodTypeAny>(schema: T) => {
  return preprocess((arg) => (arg === null ? undefined : arg), schema);
};

export function nullToUndefined<T extends z.ZodType>(
  schema: T
): z.ZodEffects<T>;
export function nullToUndefined<T extends Selection>(
  selection: T
): NullToUndefinedSelection<T>;
export function nullToUndefined(schemaOrSelection: z.ZodType | Selection) {
  if (schemaOrSelection instanceof z.ZodType)
    return _nullToUndefined(schemaOrSelection);

  return Object.entries(schemaOrSelection).reduce<
    NullToUndefinedSelection<any>
  >((acc, [key, value]) => {
    if (value instanceof z.ZodType) acc[key] = _nullToUndefined(value);
    else if (Array.isArray(value))
      acc[key] = [value[0], _nullToUndefined(value[1])];
    else acc[key] = value;
    return acc;
  }, {});
}

export function nullToUndefinedOnConditionalSelection(
  conditionalSelection?: undefined
): undefined;
export function nullToUndefinedOnConditionalSelection<
  T extends Record<string, Selection>
>(conditionalSelection: T): { [K in keyof T]: NullToUndefinedSelection<T[K]> };
export function nullToUndefinedOnConditionalSelection(
  conditionalSelection?: Record<string, Selection> | undefined
) {
  if (!conditionalSelection) return conditionalSelection;

  return Object.entries(conditionalSelection).reduce<
    Record<string, NullToUndefinedSelection<any>>
  >((acc, [key, value]) => {
    acc[key] = nullToUndefined(value);
    return acc;
  }, {});
}

type NullToUndefinedSelection<Sel extends Selection> = {
  [K in keyof Sel]: Sel[K] extends z.ZodType
    ? z.ZodEffects<Sel[K]>
    : Sel[K] extends [infer R, infer ZT]
    ? ZT extends z.ZodType
      ? [R, z.ZodEffects<ZT>]
      : never
    : Sel[K];
};
