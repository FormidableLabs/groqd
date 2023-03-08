import { z } from "zod";
import type { Selection } from "./types";
import { extendsBaseQuery, isQuerySchemaTuple } from "./typeGuards";

// Recursively define projections to pick up nested conditionals
export function getProjectionEntriesFromSelection(selection: Selection) {
  return Object.entries(selection).reduce<string[]>((acc, [key, val]) => {
    let toPush = "";
    if (extendsBaseQuery(val)) {
      toPush = `"${key}": ${val.query}`;
    } else if (isQuerySchemaTuple(val)) {
      toPush = `"${key}": ${val[0]}`;
    } else {
      toPush = key;
    }

    if (toPush) acc.push(toPush);

    return acc;
  }, []);
}

export function getSchemaFromSelection(selection: Selection): z.ZodObject<any> {
  return z.object(
    Object.entries(selection).reduce<z.ZodRawShape>((acc, [key, value]) => {
      if (extendsBaseQuery(value)) {
        acc[key] = value.schema;
      } else if (isQuerySchemaTuple(value)) {
        acc[key] = value[1];
      } else if (value instanceof z.ZodType) {
        acc[key] = value;
      }
      return acc;
    }, {})
  );
}
