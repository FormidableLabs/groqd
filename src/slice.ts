import { z } from "zod";
import { BaseResult } from "./types";

/**
 * Used for "slicing" a list of documents, corresponds to [0..2]-like syntax in GROQ.
 * @param {number} min - starting index for the slice.
 * @param {number?} max - optional max value for the slice. If omitted, will grab a single document.
 */
export const slice =
  <Max extends number | undefined>(min: number, max?: Max) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = undefined extends Max
      ? T extends z.ZodArray<infer R>
        ? R
        : T
      : T extends z.ZodArray<any>
      ? T
      : z.ZodNever;

    const schema = (() => {
      // Max provided (don't reduce to single-value)
      if (typeof max === "number") {
        if (prev.schema instanceof z.ZodArray) return prev.schema;
        return z.never();
      }
      // No max provided, reduce array to single value
      else {
        if (prev.schema instanceof z.ZodArray) return prev.schema.element;
        return prev.schema;
      }
    })();

    return {
      query:
        prev.query + `[${min}${typeof max === "number" ? `..${max}` : ""}]`,
      schema,
    } as BaseResult<NewType>;
  };
