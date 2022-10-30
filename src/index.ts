import { z } from "zod";
import { filter } from "./filter";
import { BaseResult } from "./types";
import { order } from "./order";
import { grab } from "./grab";
import { slice } from "./slice";
import { makeField } from "./fields";
import { deref } from "./deref";

type Fn<L, R> = {
  (arg: L): R;
};

// Nasty overloads
type BaseUnknown = BaseResult<z.ZodUnknown>;
type BaseUnknownArray = BaseResult<z.ZodArray<z.ZodUnknown>>;
function pipe<BaseQuery extends "*" | string, T>(
  baseQuery: BaseQuery
): "*" extends BaseQuery ? BaseUnknownArray : BaseUnknown;
function pipe<BaseQuery extends "*" | string, A>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>
): A extends BaseResult<infer R> ? BaseResult<R> : A;
function pipe<BaseQuery extends "*" | string, A, B>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>,
  op2: Fn<A, B>
): B extends BaseResult<infer R> ? BaseResult<R> : B;
function pipe<BaseQuery extends "*" | string, A, B, C>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>
): C extends BaseResult<infer R> ? BaseResult<R> : C;
function pipe<BaseQuery extends "*" | string, A, B, C, D>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>
): D extends BaseResult<infer R> ? BaseResult<R> : D;
function pipe<BaseQuery extends "*" | string, A, B, C, D, E>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>,
  op5: Fn<D, E>
): E extends BaseResult<infer R> ? BaseResult<R> : E;
function pipe<BaseQuery extends "*" | string, A, B, C, D, E, F>(
  baseQuery: BaseQuery,
  op1: Fn<"*" extends BaseQuery ? BaseUnknownArray : BaseUnknown, A>,
  op2: Fn<A, B>,
  op3: Fn<B, C>,
  op4: Fn<C, D>,
  op5: Fn<D, E>,
  op6: Fn<E, F>
): F extends BaseResult<infer R> ? BaseResult<R> : F;

function pipe<BaseQuery extends "*" | string>(
  baseQuery: BaseQuery,
  ...ops: any[]
) {
  let x = {
    query: baseQuery,
    schema: baseQuery === "*" ? z.array(z.unknown()) : z.unknown(),
  };
  for (let i = 0; i < ops.length; i++) x = ops[i](x);
  return x;
}

// TODO: Naked projection
// TODO: conditional fields
// TODO: Root and Parent references? that might just be in filters etc

// Date helper to parse date strings
const dateSchema = z.preprocess((arg) => {
  if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date());

// Bind to pipe fn.
pipe.filter = filter;
pipe.order = order;
pipe.grab = grab;
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
