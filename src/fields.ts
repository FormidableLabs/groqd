import { z } from "zod";
import { Field } from "./types";

export const makeField = <I, O extends z.ZodType>(fn: (...args: I[]) => O) => {
  return (name: string, ...args: I[]): Field<O> => {
    return {
      name,
      schema: fn(...args),

      mod<N extends z.ZodType>(f: (x: O) => N) {
        // TODO: Fix this...
        // @ts-ignore
        this.schema = f(this.schema);
        return this as unknown as Field<N>;
      },
    };
  };
};
