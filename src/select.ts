import { z } from "zod";
import { BaseQuery } from "./builder";

export const select = <
  Conditions extends Record<
    string,
    Selection | BaseQuery<any> | [string, z.ZodType]
  >
>(
  conditionalSelections: Conditions
) => {
  // Recursively define projections to pick up nested conditionals
  const getProjectionEntries = (sel: Selection) =>
    Object.entries(sel).reduce<string[]>((acc, [key, val]) => {
      let toPush = "";
      if (val instanceof BaseQuery) {
        toPush = `"${key}": ${val.query}`;
      } else if (Array.isArray(val)) {
        toPush = `"${key}": ${val[0]}`;
      } else {
        toPush = key;
      }

      if (toPush) acc.push(toPush);

      return acc;
    }, []);

  const getProjection = (
    v: Selection | BaseQuery<any> | [string, z.ZodType]
  ) => {
    if (v instanceof BaseQuery) {
      return v.query;
    }

    if (Array.isArray(v)) {
      return v[0];
    }

    return `{ ${getProjectionEntries(v).join(", ")} }`;
  };

  const { default: defaultSelection, ...selections } = conditionalSelections;

  const condProjections = Object.entries(selections).reduce<string[]>(
    (acc, [condition, val]) => {
      acc.push(`${condition} => ${getProjection(val)}`);
      return acc;
    },
    []
  );

  if (defaultSelection) {
    condProjections.push(getProjection(defaultSelection));
  }

  const query = `select(${condProjections.join(", ")})`;

  const newSchema = (() => {
    const parseSelection = (selection: Selection) =>
      Object.entries(selection).reduce<z.ZodRawShape>((acc, [key, value]) => {
        if (value instanceof BaseQuery) {
          acc[key] = value.schema;
        } else if (Array.isArray(value)) {
          acc[key] = value[1];
        } else if (value instanceof z.ZodType) {
          acc[key] = value;
        }
        return acc;
      }, {});

    const toSchemaInput = (
      v: Conditions[keyof Conditions]
    ): ConditionSchema<Conditions[keyof Conditions]> => {
      if (extendsBaseQuery(v)) return v.schema;

      if (isQuerySchemaTuple(v)) {
        return v[1] as ConditionSchema<Conditions[keyof Conditions]>;
      }

      return z.object(parseSelection(v as Selection)) as ConditionSchema<
        Conditions[keyof Conditions]
      >;
    };

    const unionEls = (
      Object.values(conditionalSelections) as Conditions[keyof Conditions][]
    ).map(toSchemaInput);

    return z.union([unionEls[0], unionEls[1], ...unionEls.slice(2)]);
  })();

  return new BaseQuery({
    query,
    schema: newSchema,
  });
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

type ConditionSchema<
  Condition extends Selection | BaseQuery<any> | [string, z.ZodType]
> = Condition extends Selection
  ? FromSelection<Condition>
  : Condition extends BaseQuery<any>
  ? Condition["schema"]
  : Condition extends [string, z.ZodType]
  ? Condition[1]
  : never;

function extendsBaseQuery<T>(v: T): v is T extends BaseQuery<any> ? T : never {
  return v instanceof BaseQuery;
}

function isQuerySchemaTuple<
  T extends Selection | BaseQuery<any> | [string, z.ZodType]
>(v: T): v is T extends [string, z.ZodType] ? T : never {
  return Array.isArray(v);
}
