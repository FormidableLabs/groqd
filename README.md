# `safe-groq` (🧪experimental🧪)

## Introduction

`safe-groq` is a schema-unaware, runtime-safe query builder for [GROQ](https://www.sanity.io/docs/groq). **The goal of `safe-groq` is to give you (most of) the flexibility of GROQ, with the runtime/type safety of [Zod](https://github.com/colinhacks/zod) and TypeScript.**

`safe-groq` works by accepting a series of GROQ operations, and generating a query to be used by GROQ and a Zod schema to be used for parsing the associated GROQ response.

An illustrative example:

```ts
// Get all of the Pokemon types, and the Pokemon associated to each type.
const { query, schema } = q(
  "*",
  q.filter("_type == 'poketype'"),
  q.grab({
    name: q.string(),
    pokemons: q(
      "*",
      q.filter("_type == 'pokemon' && references(^._id)"),
      q.grab({ name: q.string() })
    ),
  })
);

// Use the schema and the query as you see fit, for example:
const response = schema.parse(await sanityClient.fetch(query));

// At this point, response has a type of:
// { name: string, pokemons: { name: string }[] }[]
// 👆👆
```

Since the primary use-case for `safe-groq` is actually executing GROQ queries and validating the response, we ship a utility to help you make your own fetching function. Here's an example of wrapping `@sanity/client`'s fetch function:

```ts
import sanityClient from "@sanity/client";

const client = sanityClient({ /* ... */});
// 👇 Safe query runner
export const runQuery = makeSafeQueryRunner(client.fetch);

// ...

// 👇 Now you can run queries and `data` is strongly-typed, and runtime-validated.
const data = await runQuery(
	q(
		"*",
		q.filter("_type == 'pokemon'"),
		q.grab({ name: q.string() }),
		q.slice(0, 150),
	)
);
// data: { name: string }[]
```

## API:

TODO:

## FAQ

- Why schema-unaware?
- 
