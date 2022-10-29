import { z } from "zod";
import { filter } from "./filter";
import { BaseResult } from "./types";
import { order } from "./order";
import { select } from "./select";
import { slice } from "./slice";
import { makeField, number, string } from "./fields";

/**
 * Fns
 */

const empty = (): BaseResult<z.ZodUnknown> => ({
  query: "",
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

function pipe(source: any, ...args: any[]) {
  let x = source;
  for (let i = 0; i < args.length; i++) x = args[i](x);
  return x;
}

// TODO: Naked projection
// TODO: dereferencing
// TODO: conditional fields
// TODO: Root and Parent references? that might just be in filters etc
// TODO: metaprogramming to allow user to do q.number('age').optional().default(0)

// Bind to pipe fn.
pipe.empty = empty;
pipe.all = all;
pipe.filter = filter;
pipe.order = order;
pipe.select = select;
pipe.slice = slice;
// Field types
pipe.string = string;
pipe.number = number;

export const q = pipe;
