import { z } from "zod";
import { filter } from "./filter";
import { BaseResult } from "./types";
import { order } from "./order";
import { grab } from "./grab";
import { slice } from "./slice";
import { deref } from "./deref";
import { grabOne } from "./grabOne";

type Fn<L, R> = {
  (arg: L): R;
};

type BaseUnknown = BaseResult<z.ZodUnknown>;
type BaseUnknownArray = BaseResult<z.ZodArray<z.ZodUnknown>>;

/**
 * Pipeline for generating queries.
 */
function pipe<BaseQuery extends "*" | string>(
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

// Date helper to parse date strings
const dateSchema = z.preprocess((arg) => {
  if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date());

pipe.filter = filter;
pipe.order = order;
pipe.grab = grab;
pipe.grabOne = grabOne;
pipe.slice = slice;
pipe.deref = deref;

pipe.string = z.string;
pipe.number = z.number;
pipe.boolean = z.boolean;
pipe.unknown = z.unknown;
pipe.null = z.null;
pipe.undefined = z.undefined;
pipe.date = () => dateSchema;
// TODO: pipe.union...?
// TODO: pipe.literal? pipe.enum?

// Our main export is the pipe, renamed as q
export const q = pipe;

// Export some types that are useful
export type QueryResult<T> = BaseResult<T>;
export type BaseType<T = any> = z.ZodType<T>;

type QueryExecutor = (query: string) => Promise<any>;

/**
 * Utility to create a "query runner" that consumes the result of the `q` function.
 */
export const makeSafeQueryRunner =
  (fn: QueryExecutor) =>
  <T extends BaseType>({
    query,
    schema,
  }: QueryResult<T>): Promise<z.infer<T>> =>
    fn(query).then((res) => schema.parse(res));
