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
        ? z.union([unionEls[0], unionEls[1], ...unionEls.slice(2)])
        : z.union([z.null(), unionEls[0], ...unionEls.slice(1)])
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

const emptyObject = z.object({});
type EmptyZodObject = typeof emptyObject;
type ZodObjectAny = z.ZodObject<Record<string, any>>;
export type ZodUnionAny = z.ZodUnion<
  readonly [z.ZodTypeAny, ...z.ZodTypeAny[]]
>;

export type Spread<ZU extends ZodUnionAny> = ZU extends z.ZodUnion<
  infer T extends readonly [z.ZodTypeAny, ...z.ZodTypeAny[]]
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
