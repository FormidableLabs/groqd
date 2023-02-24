import { z } from "zod";
import { ValueOf } from "./types";
import { ArrayQuery, BaseQuery, EntityQuery } from "./builder";

export const grab = <
  T extends z.ZodTypeAny | z.ZodArray<any>,
  S extends Selection,
  CondSelections extends Record<string, Selection> | undefined
>(
  query: string,
  schema: T,
  selection: S,
  conditionalSelections?: CondSelections
) => {
  type ConditionalSelection = ValueOf<{
    [K in keyof CondSelections]: FromSelection<S & CondSelections[K]>;
  }>;

  type AllSelection = undefined extends CondSelections
    ? FromSelection<S>
    : S extends Record<string, never>
    ? ConditionalSelection
    : z.ZodUnion<[ConditionalSelection, FromSelection<S>]>;

  type NewType = T extends z.ZodArray<any>
    ? ArrayQuery<AllSelection>
    : EntityQuery<AllSelection>;

  // Recursively define projections to pick up nested conditionals
  const getProjections = (sel: Selection) =>
    Object.entries(sel).reduce<string[]>((acc, [key, val]) => {
      let toPush = "";
      if (val instanceof BaseQuery) {
        toPush = `"${key}": ${val.query}`;
      } else if (Array.isArray(val)) {
        toPush = `"${key}": ${val[0]}`;
      } else {
        toPush = key;
      }

      toPush && acc.push(toPush);
      return acc;
    }, []);
  const projections = getProjections(selection);
  if (conditionalSelections) {
    const condProjections = Object.entries(conditionalSelections).reduce<
      string[]
    >((acc, [key, val]) => {
      acc.push(`${key} => { ${getProjections(val).join(", ")} }`);
      return acc;
    }, []);

    projections.push(`...select(${condProjections.join(", ")})`);
  }

  const newSchema = (() => {
    const toSchemaInput = (sel: Selection) =>
      Object.entries(sel).reduce<z.ZodRawShape>((acc, [key, value]) => {
        if (value instanceof BaseQuery) {
          acc[key] = value.schema;
        } else if (Array.isArray(value)) {
          acc[key] = value[1];
        } else if (value instanceof z.ZodType) {
          acc[key] = value;
        }
        return acc;
      }, {});

    // Split base and conditional fields
    const conditionalFields = Object.values(
      conditionalSelections || {}
    ) as Selection[];

    const baseSchema = z.object(toSchemaInput(selection));
    const conditionalFieldSchemas = conditionalFields.map((field) =>
      baseSchema.merge(z.object(toSchemaInput(field)))
    );

    const unionEls =
      Object.keys(baseSchema).length === 0
        ? conditionalFieldSchemas
        : [...conditionalFieldSchemas, baseSchema];
    const s =
      unionEls.length > 1
        ? z.union([unionEls[0], unionEls[1], ...unionEls.slice(2)])
        : unionEls[0];

    return schema instanceof z.ZodArray ? z.array(s) : s;
  })();

  const res = (
    newSchema instanceof z.ZodArray
      ? new ArrayQuery({
          query: query + `{${projections.join(", ")}}`,
          schema: newSchema,
        })
      : new EntityQuery({
          query: query + `{${projections.join(", ")}}`,
          schema: newSchema,
        })
  ) as NewType;

  return res;
};

/**
 * Misc util
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
