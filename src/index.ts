import { z } from "zod";
import { UnknownQuery } from "./builder";
import { sanityImage } from "./sanityImage";
import { schemas } from "./schemas";
import { select } from "./select";

import type { InferType, TypeFromSelection } from "./types";

export type { InferType, TypeFromSelection } from "./types";
export type { Selection } from "./grab";
export { makeSafeQueryRunner } from "./makeSafeQueryRunner";
export { nullToUndefined } from "./nullToUndefined";

export const pipe = (filter: string): UnknownQuery => {
  return new UnknownQuery({ query: filter });
};

pipe.sanityImage = sanityImage;
pipe.select = select;

// Add schemas
Object.assign(pipe, schemas);
type Pipe = typeof pipe & typeof schemas;

// Our main export is the pipe, renamed as q
export const q = pipe as Pipe;

const foo = q.select({
  "booger > 5": ["hello", q.literal("hello")],
  "booger > 10": {
    bar: q.literal("bar"),
  },
  "booger > 15": {
    bar: q.string(),
    id: q.string(),
  },
  default: {
    form: q("form").deref().grab({
      boop: q.number(),
    }),
  },
});

const query = q("*").grab({
  foo,
});

type Query = InferType<typeof query>;
type Foo = InferType<typeof foo>;

/**
 * Export zod for convenience
 */
export { z };
