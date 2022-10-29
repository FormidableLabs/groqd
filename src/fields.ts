import { z } from "zod";
import { Field } from "./types";

export const string = (name: string): Field<z.ZodString> => ({
  name,
  schema: z.string(),
});
export const number = (name: string): Field<z.ZodNumber> => ({
  name,
  schema: z.number(),
});

export const nameSym = Symbol("name");
export const makeField = <I, O>(fn: (...args: I[]) => O) => {
  return (name: string, ...args: I[]): O => {
    const s = fn(...args);
    // @ts-ignore
    s[nameSym] = name;

    return s;
  };
};
