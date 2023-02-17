import { z } from "zod";
import { UnknownQuery } from "./builder";
import { sanityImage } from "./sanityImage";
import { schemas } from "./schemas";

export type { InferType, TypeFromSelection } from "./types";
export type { Selection } from "./grab";
export { makeSafeQueryRunner } from "./makeSafeQueryRunner";
export { nullToUndefined } from "./nullToUndefined";

export const pipe = (filter: string): UnknownQuery => {
  return new UnknownQuery({ query: filter });
};

pipe.sanityImage = sanityImage;

// Add schemas
Object.assign(pipe, schemas);
type Pipe = typeof pipe & typeof schemas;

// Our main export is the pipe, renamed as q
export const q = pipe as Pipe;

/**
 * Export zod for convenience
 */
export { z };
