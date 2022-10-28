import { z } from "zod";

/**
 * Piping
 */
type Fn<L, R> = {
	(arg: L): R;
};

// Nasty overloads
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

type Selection = Record<string, Field<z.ZodString | z.ZodNumber>>;
type Field<T extends z.ZodType> = { name: string; schema: T };
type FromField<T> = T extends Field<z.ZodType<infer R>> ? R : never;
type FromSelection<T extends Selection> = { [K in keyof T]: FromField<T[K]> };

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
	schema: z.ZodType<T>;
};

type AllResult = BaseResult<unknown> & {
	__type: "all";
};

type FilterResult<T> = BaseResult<T> & {
	__type: "filter";
};

type OrderResult<T> = BaseResult<T> & {
	__type: "order";
};

type SelectionResult<T> = BaseResult<T> & {
	__type: "select";
};

type AnyResult<T> =
	| AllResult
	| FilterResult<T>
	| OrderResult<T>
	| SelectionResult<T>;

const all = (): AllResult => ({
	__type: "all",
	query: "*",
	schema: z.unknown(),
});

const filter =
	(filterValue: string) =>
	<T>(prev: AnyResult<T>) => {
		// I think
		type NewType = T extends Array<infer R> ? R[] : null;
		const schema = prev.schema instanceof z.ZodArray ? prev.schema : z.null();

		return {
			__type: "filter",
			query: prev.query + `[${filterValue}]`,
			schema: schema as unknown as z.ZodType<NewType>,
		} as FilterResult<NewType>;
	};

const order =
	(...args: `${string} ${"asc" | "desc"}`[]) =>
	<T>(prev: AnyResult<T>): OrderResult<T> => {
		// TODO: If not an array, this should null out

		return {
			__type: "order",
			query: prev.query + `|order(${args.join(", ")})`,
			schema: prev.schema as z.ZodType<T>,
		};
	};

const select =
	<S extends Selection>(selection: S) =>
	<T>(prev: AnyResult<T>) => {
		type NewType = T extends Array<infer R>
			? Array<Expand<FromSelection<S> & R>>
			: Expand<FromSelection<S> & T>;

		return {
			__type: "select",
			query: prev.query,
			schema: prev.schema as unknown as z.ZodType<NewType>,
			// schema: "schema" in prev ? prev.schema : ({} as T),
		} as SelectionResult<NewType>;
	};

// Bind to pipe fn.
pipe.all = all;
pipe.filter = filter;
pipe.order = order;
pipe.select = select;
// Field types
pipe.string = string;
pipe.number = number;

export const q = pipe;

// export const q = { pipe, all, filter, order, select };

const { schema } = q(
	q.all(),
	q.select({ name: q.string("name"), age: q.number("age") })
);

const r = schema.parse({});
console.log(r);

/**
 * Try builder pattern?
 */

class QueryBuilder<T extends unknown> {
	__query = "";
	__schema: unknown;

	constructor(query?: string) {
		this.__query = query || "";
	}

	select<S extends Selection>(selection: S) {
		type NewType = T extends Array<infer R>
			? Array<Expand<S & R>>
			: Expand<S & T>;

		// Weird, weird hack because TS gets mad otherwise
		const that = this as QueryBuilder<NewType>;
		return that;
	}

	filter(filterValue: string) {
		type NewType = T extends Array<infer R> ? R[] : T[];
		this.__query += `[${filterValue}]`;
		// TODO: Modify schema

		const that = this as QueryBuilder<NewType>;
		return that;
	}

	order(...args: `${string} ${"asc" | "desc"}`[]) {
		this.__query += `|order(${args.join(", ")})`;
		// TODO: Modify schema

		return this;
	}

	slice<Max extends Number | undefined>(min: number, max?: Max) {
		type NewType = Number extends Max ? (T extends Array<infer R> ? R : T) : T;
		this.__query += `[${min}${typeof max === "number" ? `..${max}` : ""}]`;
		// TODO: Modify schema

		const that = this as QueryBuilder<NewType>;
		return that;
	}

	peak() {
		return {} as T;
	}

	get query() {
		return this.__query;
	}
}

export const oldAll = () => new QueryBuilder("*");

const res = oldAll()
	.filter("")
	.select({ name: true })
	.select({ age: true })
	.filter("")
	.order("name asc")
	.slice(3)
	.peak();
