import { z } from "zod";
import { UnknownArrayQuery, UnknownQuery } from "./builder";
import { sanityImage } from "./sanityImage";
import { schemas } from "./schemas";
import { select } from "./select";

export type { InferType, TypeFromSelection, Selection } from "./types";
export { makeSafeQueryRunner, GroqdParseError } from "./makeSafeQueryRunner";
export { nullToUndefined } from "./nullToUndefined";

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
// export const pipe = (filter: string): UnknownQuery => {
//   return new UnknownQuery({ query: filter });
// };

pipe.sanityImage = sanityImage;
pipe.select = select;

// Add schemas
Object.assign(pipe, schemas);
type Pipe = typeof pipe & typeof schemas;

// Our main export is the pipe, renamed as q
export const q = pipe as Pipe;

/**
 * Export zod for convenience
 */
export { z };
