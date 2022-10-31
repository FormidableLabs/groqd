import { BaseResult } from "./types";
import { z } from "zod";

/**
 * Naked projection. Could probably use a better name...
 */
export const grabOne =
  <GrabOneType extends z.ZodType>(name: string, fieldSchema: GrabOneType) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any>
      ? z.ZodArray<GrabOneType>
      : GrabOneType;

    const schema = (() => {
      if (prev.schema instanceof z.ZodArray) {
        return z.array(fieldSchema);
      } else {
        return fieldSchema;
      }
    })();

    return {
      query: prev.query + `.${name}`,
      schema: schema,
    } as BaseResult<NewType>;
  };
