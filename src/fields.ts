import { z } from "zod";

export const makeField = <I, O extends z.ZodType>(fn: (...args: I[]) => O) =>
  fn;
