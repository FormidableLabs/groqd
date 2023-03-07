import { z } from "zod";
import { BaseQuery } from "./baseQuery";
import {
  getProjectionEntriesFromSelection,
  getSchemaFromSelection,
} from "./selectionUtils";
import { extendsBaseQuery, isQuerySchemaTuple } from "./typeGuards";
import type { FromSelection, Selection } from "./types";

export const select = <Conditions extends ConditionRecord>(
  conditionalSelections: Conditions
) => {
  const getProjection = (
    v: Selection | BaseQuery<any> | [string, z.ZodType]
  ) => {
    if (extendsBaseQuery(v)) {
      return v.query;
    }

    if (isQuerySchemaTuple(v)) {
      return v[0];
    }

    return `{ ${getProjectionEntriesFromSelection(v).join(", ")} }`;
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

  const newSchema: SelectSchemaType<Conditions> = (() => {
    const toSchemaInput = (
      v: Conditions[keyof Conditions]
    ): ConditionSchema<Conditions[keyof Conditions]> => {
      if (extendsBaseQuery(v)) return v.schema;

      if (isQuerySchemaTuple(v)) {
        return v[1] as ConditionSchema<Conditions[keyof Conditions]>;
      }

      return getSchemaFromSelection(v as Selection) as ConditionSchema<
        Conditions[keyof Conditions]
      >;
    };

    const unionEls = (
      Object.values(conditionalSelections) as Conditions[keyof Conditions][]
    ).map(toSchemaInput);

    return (
      conditionalSelections.default
        ? // @ts-expect-error unionEls will be a tuple
          z.union(unionEls)
        : // @ts-expect-error unionEls will be a tuple
          z.union([z.null(), ...unionEls])
    ) as SelectSchemaType<Conditions>;
  })();

  return new BaseQuery({
    query,
    schema: newSchema,
  });
};

/**
 * Misc util
 */

export type ConditionValue = Selection | BaseQuery<any> | [string, z.ZodType];
export type ConditionRecord = Record<string, ConditionValue>;
export type ConditionSchema<Condition extends ConditionValue> =
  Condition extends Selection
    ? FromSelection<Condition>
    : Condition extends BaseQuery<any>
    ? Condition["schema"]
    : Condition extends [string, z.ZodType]
    ? Condition[1]
    : never;

export type SelectSchemaType<Conditions extends ConditionRecord> = z.ZodUnion<
  Conditions extends { default: any }
    ? [
        ConditionSchema<Conditions[keyof Conditions]>,
        ConditionSchema<Conditions[keyof Conditions]>,
        ...ConditionSchema<Conditions[keyof Conditions]>[]
      ]
    : [
        z.ZodNull,
        ConditionSchema<Conditions[keyof Conditions]>,
        ...ConditionSchema<Conditions[keyof Conditions]>[]
      ]
>;

const emptyZodRecord = z.record(z.string(), z.never());
type EmptyZodObject = typeof emptyZodRecord;
type ZodObjectAny = z.ZodObject<Record<string, any>>;
export type ZodUnionAny = z.ZodUnion<readonly [z.ZodType, ...z.ZodType[]]>;

// go through each type in a zod union
// if it's an object, resolve to that object
// if it's a union, apply the same logic to each type in that union
// if it's a primitive, resolve to an empty object
export type Spread<ZU extends ZodUnionAny> = ZU extends z.ZodUnion<
  infer T extends readonly [z.ZodType, ...z.ZodType[]]
>
  ? z.ZodUnion<
      [
        T[number] extends infer U
          ? U extends ZodObjectAny
            ? U
            : U extends ZodUnionAny
            ? Spread<U>
            : EmptyZodObject
          : never
      ]
    >
  : never;

export function spreadUnionSchema<Z extends z.ZodType>(
  union: z.ZodUnion<[Z, Z, ...Z[]]>
): Spread<typeof union> {
  const spreadOptions: Spread<typeof union>["options"] = union.options.map(
    (option) => {
      // option is a zod object
      if ("shape" in option) return option;

      // @ts-expect-error option is a zod union
      // Inferring nested union types within zod union outside the casted
      // return type is unreasonable. It is fine to ignore ts here because the casted
      // the return type at the end of this function is correct
      if ("options" in option) return spreadUnionSchema(option);

      // option is a zod primitive
      return z.record(z.string(), z.never());
    }
  ) as Spread<typeof union>["options"];

  // @ts-expect-error Zod complains here but at the end of the day,
  // we're basically doing `z.union(z.union([/* some tuple */]).options)`
  // which is completely valid
  return z.union(spreadOptions) as unknown as Spread<typeof union>;
}
