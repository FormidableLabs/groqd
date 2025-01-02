import { z } from "zod";
import { UnknownArrayQuery, UnknownQuery } from "./builder";
import { sanityImage } from "./sanityImage";
import { schemas } from "./schemas";
import { select } from "./select";
import { addDeprecationMessage } from "./addDeprecationMessage";

export type { InferType, TypeFromSelection, Selection } from "./types";
export { makeSafeQueryRunner, GroqdParseError } from "./makeSafeQueryRunner";
export { nullToUndefined } from "./nullToUndefined";
export { BaseQuery } from "./baseQuery";

export function pipe(filter: string): UnknownQuery;
export function pipe<IsArray extends boolean>(
  filter: string,
  opts: { isArray: IsArray }
): IsArray extends true ? UnknownArrayQuery : UnknownQuery;
export function pipe(
  filter: string,
  { isArray = false }: { isArray?: boolean } = {}
) {
  return isArray
    ? new UnknownArrayQuery({ query: filter })
    : new UnknownQuery({ query: filter });
}

pipe.sanityImage = addDeprecationMessage(
  sanityImage,
  "`q.sanityImage` has been deprecated in favor of importing `sanityImage` directly from `groqd`. `q.sanityImage` will be removed in future versions."
);
pipe.select = select;

// Add schemas
Object.assign(pipe, schemas);
type Pipe = typeof pipe & typeof schemas;

// Our main export is the pipe, renamed as q
export const q = pipe as Pipe;

/**
 * Export zod for convenience
 */
export { z, sanityImage };
