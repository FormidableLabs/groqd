import { z } from "zod";
import type { ValueOf, FromSelection, Selection } from "./types";
import { ArrayQuery, EntityQuery } from "./builder";
import {
  getProjectionEntriesFromSelection,
  getSchemaFromSelection,
} from "./selectionUtils";

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

  const projections = getProjectionEntriesFromSelection(selection);
  if (conditionalSelections) {
    const condProjections = Object.entries(conditionalSelections).reduce<
      string[]
    >((acc, [key, val]) => {
      acc.push(
        `${key} => { ${getProjectionEntriesFromSelection(val).join(", ")} }`
      );
      return acc;
    }, []);

    projections.push(`...select(${condProjections.join(", ")})`);
  }

  const newSchema = (() => {
    // Split base and conditional fields
    const conditionalFields = Object.values(
      conditionalSelections || {}
    ) as Selection[];

    const baseSchema = getSchemaFromSelection(selection);
    const conditionalFieldSchemas = conditionalFields.map((field) =>
      baseSchema.merge(getSchemaFromSelection(field))
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
