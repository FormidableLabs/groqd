import { z } from "zod";
import { BaseQuery } from "./builder";
import {
  getProjectionEntriesFromSelection,
  getSchemaFromSelection,
} from "./selectionUtils";
import { extendsBaseQuery, isQuerySchemaTuple } from "./typeGuards";
import type { FromSelection, Selection } from "./types";

export const select = <
  Conditions extends Record<
    string,
    Selection | BaseQuery<any> | [string, z.ZodType]
  >
>(
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

  const newSchema = (() => {
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

type ConditionSchema<
  Condition extends Selection | BaseQuery<any> | [string, z.ZodType]
> = Condition extends Selection
  ? FromSelection<Condition>
  : Condition extends BaseQuery<any>
  ? Condition["schema"]
  : Condition extends [string, z.ZodType]
  ? Condition[1]
  : never;
