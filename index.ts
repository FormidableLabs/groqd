import { infer, z } from "zod";

/**
 * Piping
 */
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

function pipe(source: any, ...args: any[]) {
  let x = source;
  for (let i = 0; i < args.length; i++) x = args[i](x);
  return x;
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type Selection = Record<
  string,
  Field<z.ZodString | z.ZodNumber> | BaseResult<any>
>;
type Field<T extends z.ZodType> = { name: string; schema: T };
type FromField<T> = T extends Field<infer R> ? R : never;

const string = (name: string): Field<z.ZodString> => ({
  name,
  schema: z.string(),
});
const number = (name: string): Field<z.ZodNumber> => ({
  name,
  schema: z.number(),
});

/**
 * Fns
 */
type BaseResult<T> = {
  query: string;
  schema: T;
};

const empty = (): BaseResult<z.ZodUnknown> => ({
  query: "",
  schema: z.unknown(),
});

const all = (): BaseResult<z.ZodArray<z.ZodUnknown>> => ({
  query: "*",
  schema: z.array(z.unknown()),
});

const filter =
  (filterValue: string) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any> ? T : z.ZodNull;
    const schema = prev.schema instanceof z.ZodArray ? prev.schema : z.null();

    return {
      __type: "filter",
      query: prev.query + `[${filterValue}]`,
      schema: schema,
    } as BaseResult<NewType>;
  };

const order =
  (...args: `${string} ${"asc" | "desc"}`[]) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any> ? T : z.ZodNever;
    const schema = prev.schema instanceof z.ZodArray ? prev.schema : z.never();

    return {
      __type: "order",
      query: prev.query + `|order(${args.join(", ")})`,
      schema: schema,
    } as BaseResult<NewType>;
  };

// TODO: prev argument should probably be dynamic so you can't do something like { name }{ name, age } (since age will null out)
// TODO: selection should be able to accept a sub-query for joins
const select =
  <S extends Selection>(selection: S) =>
  <T>(prev: BaseResult<T>) => {
    type FromSelection<T extends Selection> = z.ZodObject<{
      [K in keyof T]: T[K] extends BaseResult<any>
        ? T[K]["schema"]
        : FromField<T[K]>;
    }>;
    type KeysFromSelection<T extends Selection> = keyof T & string;

    // Start with array type
    type NewType = T extends z.ZodArray<infer R>
      ? // No types yet? Use the types from selection
        R extends z.ZodUnknown
        ? z.ZodArray<FromSelection<S>>
        : // Otherwise, if we're an object – pick keys from the original.
        R extends z.ZodObject<infer R2>
        ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
        : z.ZodNever
      : // Input was not an array, do a similar take/pick approach
      T extends z.ZodUnknown
      ? z.ZodArray<FromSelection<S>>
      : T extends z.ZodObject<infer R2>
      ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
      : z.ZodNever;

    const projections = Object.entries(selection).reduce<string>(
      (acc, [key, val]) => {
        acc += "query" in val ? `"${key}": ${val.query}` : val.name;
        return acc;
      },
      ""
    );

    // TODO: Need to update schema to handle nested queries.
    // Schema gets a bit trickier, since we sort of have to mock GROQ behavior.
    const schema = (() => {
      // Array
      if (prev.schema instanceof z.ZodArray) {
        // Unknown schema means we just use the selection passed
        if (prev.schema.element instanceof z.ZodUnknown) {
          const s = Object.entries(selection).reduce<z.ZodRawShape>(
            (acc, [key, value]) => {
              acc[key] = value.schema;
              return acc;
            },
            {}
          );
          return z.array(z.object(s));
        }
        // If we're already dealing with an object schema inside our array, we need to do a Pick
        else if (prev.schema.element instanceof z.ZodObject) {
          const toPick = Object.keys(selection).reduce<{
            [key: string]: true;
          }>((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
          return z.array(prev.schema.element.pick(toPick));
        }
        // If not unknown/object, I don't know what happened 👀
        else {
          return z.never();
        }
      }
      // Not an array...
      else {
        if (prev.schema instanceof z.ZodUnknown) {
          const s = Object.entries(selection).reduce<z.ZodRawShape>(
            (acc, [key, value]) => {
              acc[key] = value.schema;
              return acc;
            },
            {}
          );
          return z.object(s);
        } else if (prev.schema instanceof z.ZodObject) {
          const toPick = Object.keys(selection).reduce<{
            [key: string]: true;
          }>((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
          return prev.schema.pick(toPick);
        }

        return z.never();
      }
    })();

    return {
      query: prev.query + `{${projections}}`,
      schema: schema,
    } as BaseResult<NewType>;
  };

// Slicing a set
const slice =
  <Max extends number | undefined>(min: number, max?: Max) =>
  <T>(prev: BaseResult<T>) => {
    // TODO: This is wrong...
    type NewType = undefined extends Max
      ? T extends z.ZodArray<infer R>
        ? R
        : T
      : T extends z.ZodArray<any>
      ? T
      : z.ZodNever;

    const schema = (() => {
      // Max provided (don't reduce to single-value)
      if (typeof max === "number") {
        if (prev.schema instanceof z.ZodArray) return prev.schema;
        return z.never();
      }
      // No max provided, reduce array to single value
      else {
        if (prev.schema instanceof z.ZodArray) return prev.schema.element;
        return prev.schema;
      }
    })();

    return {
      query:
        prev.query + `[${min}${typeof max === "number" ? `..${max}` : ""}]`,
      schema,
    } as BaseResult<NewType>;
  };

// TODO: Naked projection
// TODO: dereferencing
// TODO: conditional fields
// TODO: Root and Parent references? that might just be in filters etc

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
