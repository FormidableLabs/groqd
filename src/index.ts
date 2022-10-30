import { z } from "zod";
import { filter } from "./filter";
import { BaseResult } from "./types";
import { order } from "./order";
import { select } from "./select";
import { slice } from "./slice";
import { makeField } from "./fields";
import { deref } from "./deref";

const query = (q?: string): BaseResult<z.ZodUnknown> => ({
  query: q || "",
  schema: z.unknown(),
});

const all = (): BaseResult<z.ZodArray<z.ZodUnknown>> => ({
  query: "*",
  schema: z.array(z.unknown()),
});

type Fn<L, R> = {
  (arg: L): R;
};

// Nasty overloads
function pipe<T>(source: T): T;
function pipe<T, A>(
  source: T,
  op1: Fn<T, A>
): A extends BaseResult<infer R> ? BaseResult<R> : A;
function pipe<T, A, B>(
  source: T,
  op1: Fn<T, A>,
  op2: Fn<A, B>
): B extends BaseResult<infer R> ? BaseResult<R> : B;
function pipe<T, A, B, C>(
  source: T,
  op1: Fn<T, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>
): C extends BaseResult<infer R> ? BaseResult<R> : C;
function pipe<T, A, B, C, D>(
  source: T,
  op1: Fn<T, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>
): D extends BaseResult<infer R> ? BaseResult<R> : D;
function pipe<T, A, B, C, D, E>(
  source: T,
  op1: Fn<T, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>,
  op5: Fn<D, E>
): E extends BaseResult<infer R> ? BaseResult<R> : E;
function pipe<T, A, B, C, D, E, F>(
  source: T,
  op1: Fn<T, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>,
  op5: Fn<D, E>,
  op6: Fn<E, F>
): F extends BaseResult<infer R> ? BaseResult<R> : F;

function pipe(source: any, ...args: any[]) {
  let x = source;
  for (let i = 0; i < args.length; i++) x = args[i](x);
  return x;
}

// TODO: Naked projection
// TODO: conditional fields
// TODO: Root and Parent references? that might just be in filters etc

/**
 * How do I do something like this:
 *
 * 	*[_type == "owner"] {
 *   	"pets": pets[]->{name}
 * 	}
 *
 *	In this case, we have "pets"
 */

// Date helper to parse date strings
const dateSchema = z.preprocess((arg) => {
  if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date());

// Bind to pipe fn.
pipe.query = query;
pipe.all = all;
pipe.filter = filter;
pipe.order = order;
pipe.select = select;
pipe.slice = slice;
pipe.deref = deref;
// Field types
pipe.string = z.string;
pipe.number = z.number;
pipe.boolean = makeField(z.boolean);
pipe.date = makeField(() => dateSchema);
// TODO: pipe.union...?

export const q = pipe;

export type QueryResult<T> = BaseResult<T>;
