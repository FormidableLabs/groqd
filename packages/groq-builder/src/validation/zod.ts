import { z } from "zod";
import { nullToUndefined } from "../commands/functions/nullToUndefined";

export const zod = {
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  literal: z.literal,
  union: z.union,
  date: z.date,
  null: z.null,
  undefined: z.undefined,
  array: z.array,
  object: z.object,
  nullToUndefined,
};
