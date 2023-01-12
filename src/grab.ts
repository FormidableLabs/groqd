import { z } from "zod";
import { ValueOf } from "./types";
import { ArrayResult, BaseResult, EntityResult } from "./builder";

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
  type FromSelection<Sel extends Selection> = z.ZodObject<{
    [K in keyof Sel]: Sel[K] extends BaseResult<any>
      ? Sel[K]["schema"]
      : FromField<Sel[K]>;
  }>;

  type AllSelection = undefined extends CondSelections
    ? FromSelection<S>
    : z.ZodUnion<
        [
          ValueOf<{
            [K in keyof CondSelections]: FromSelection<S & CondSelections[K]>;
          }>,
          FromSelection<S>
        ]
      >;

  type NewType = T extends z.ZodArray<any>
    ? ArrayResult<AllSelection>
    : EntityResult<AllSelection>;

  // Recursively define projections to pick up nested conditionals
  const getProjections = (sel: Selection) =>
    Object.entries(sel).reduce<string[]>((acc, [key, val]) => {
      let toPush = "";
      if (val instanceof BaseResult) {
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
        if (value instanceof BaseResult) {
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
    const s =
      conditionalFieldSchemas.length === 0
        ? baseSchema
        : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore Need to figure out how to make tsc happy
          z.union([...conditionalFieldSchemas, baseSchema]);

    return schema instanceof z.ZodArray ? z.array(s) : s;
  })();

  const res = (schema instanceof z.ZodArray
    ? new ArrayResult({
        query: query + `{${projections.join(", ")}}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: probably should figure out what's making tsc upset here
        schema: newSchema,
      })
    : new EntityResult({
        query: query + `{${projections.join(", ")}}`,
        schema: newSchema,
      })) as unknown as ArrayResult<AllSelection>;

  return res as unknown as NewType;
};

/**
 * Misc util
 */
type Field<T extends z.ZodType> = T;
type FromField<T> = T extends Field<infer R>
  ? R
  : T extends [string, infer R]
  ? R
  : z.ZodNever;

export type Selection = Record<
  string,
  BaseResult<any> | z.ZodType | [string, z.ZodType]
>;
