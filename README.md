# `groqd` 🛠

`groqd` is a schema-unaware, runtime-safe query builder for [GROQ](https://www.sanity.io/docs/groq). **The goal of `groqd` is to give you (most of) the flexibility of GROQ, with the runtime/type safety of [Zod](https://github.com/colinhacks/zod) and TypeScript.**

`groqd` works by accepting a series of GROQ operations, and generating a query to be used by GROQ and a Zod schema to be used for parsing the associated GROQ response.

An illustrative example:

```ts
import { q } from "groqd";

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

Since the primary use-case for `groqd` is actually executing GROQ queries and validating the response, we ship a utility to help you make your own fetching function. Here's an example of wrapping `@sanity/client`'s fetch function:

```ts
import sanityClient from "@sanity/client";
import { q, makeSafeQueryRunner } from "groqd";

const client = sanityClient({ /* ... */});
// 👇 Safe query runner
export const runQuery = makeSafeQueryRunner(query => client.fetch(query));

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

Using `makeSafeQueryRunner` is totally optional; you might find using `q().schema` and `q().query` in your own abstractions works better for you.

## Why? 🤷‍

GROQ's primary use is with [Sanity](https://www.sanity.io/). Sanity's Content Lake is fundamentally unstructured, and GROQ (and Sanity's GROQ API) do not have any sort of GraqhQL-like type contracts.

We'd love to see advanced codegen for Sanity and GROQ. However, the end-result would likely not be as runtime type-safe as some might desire due to the flexibility of Sanity's Content Lake and the GROQ language in general.

The goal of `groqd` is to work around these constraints by allowing _you_ to specify the runtime data schema for your query so that your data's type is _runtime safe_ – not just theoretically, but emperically.

## API:

### `q`

A "pipe" function that takes a base query as its first argument (such as `"*"`), and a number of other valid GROQ operations from generated from `groqd` (such as `q.filter`, `q.grab`, `q.order`, and more). Returns a GROQ query as `.query` and a Zod schema as `.schema`.

```ts
const { query, schema } = q("*", q.filter("_type == 'pokemon'"), /* ... */);
```

This function is best used in conjunction with a "query runner" from [`makeSafeQueryRunner`](#makesafequeryrunner), such as:

```ts
import sanityClient from "@sanity/client";
import { q, makeSafeQueryRunner } from "groqd";

// Wrap sanityClient.fetch
const client = sanityClient({ /* ... */});
export const runQuery = makeSafeQueryRunner(query => client.fetch(query));

// Now you can fetch your query's result, and validate the response, all in one.
const data = await runQuery(q("*", q.filter("_type == 'pokemon'"), /* ... */));
```

### `q.grab`

Handles [projections](https://www.sanity.io/docs/how-queries-work#727ecb6f5e15), or selecting fields from an existing set of documents. This is one of the primary mechanisms for providing a schema for the data you expect to get. 

`q.grab` accepts a "selection" object as its sole argument, with three different forms:

```ts
q(
  "*",
  q.grab({
    // projection is `{ "name": name }`, and validates that `name` is a string.
    name: ['name', q.string()],
    
    // shorthand for `description: ['description', q.string()]`,
    //  projection is just `{ description }`
    description: q.string(),
    
    // can also pass a sub-query for the field,
    //  projection is `{ "types": types[]->{ name } }`
    types: q("types", q.filter(), q.deref(), q.grab({ name: q.string() }))
  }),
);
```

See [Schema Types](#schema-types) for available schema options, such as `q.string()`. These generally correspond to Zod primitives, so you can do something like:

```ts
q(
  "*",
  q.grab({
    name: q.string().optional().default("no name")
  }),
);
```

#### Conditional selections with `q.grab`

Groq offers a `select` operator that you can use at the field-level to conditionally select values, such as the following.

```ts
q(
  "*",
  q.grab({
    strength: [
      "select(base.Attack > 60 => 'strong', base.Attack <= 60 => 'weak')",
      q.union([q.literal("weak"), q.literal("strong")])
    ],
  })
)
```

However, in real-world practice it's common to have an array of values of varying types and you want to select different values for each type. `q.grab` allows you to do conditional selections by providing a second argument of the shape `{[condition: string]: Selection}`.

This second argument is not as flexible as the `=>` operator or `select` function in GROQ, and instead provides a way to "fork" a portion of your selection (e.g., only the base selection and _one_ of the conditional selections will be made at any give time). Here's an example.

```ts
q(
  "*",
  // Grab _id and name on all pokemon
  q.grab({
    _id: q.string(),
    name: q.string(),
  }, {
    // And for Bulbasaur, grab the HP
    "name == 'Bulbasaur'": {
      name: q.literal("Bulbasaur"),
      hp: ["base.HP", q.number()]
    },
    // And for Charmander, grab the Attack
    "name == 'Charmander'": {
      name: q.literal("Charmander"),
      attack: ["base.Attack", q.number()]
    },
  })
)
```

### `q.grabOne`

Similar to `q.grab`, but for ["naked" projections](https://www.sanity.io/docs/how-queries-work#dd66cae5ed8f) where you just need a single property (instead of an object of properties). Pass a property to be "grabbed", and a schema for the expected type.

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grabOne("name", q.string())
);
// -> string[]
```

### `q.filter`

Receives a single string argument for the GROQ filter to be applied (without the surrounding `[` and `]`). Applies the GROQ filter to the query and adjusts schema accordingly.

```ts
q("*", q.filter("_type == 'pokemon'"), /* ... */);
// translates to: *[_type == 'pokemon']
```

### `q.order`

Receives a list of ordering expression, such as `"name asc"`, and adds an order statement to the GROQ query.

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.order("name asc"),
);
// translates to *[_type == 'pokemon']|order(name asc)
```

### `q.slice`

Creates a slice operation by taking a minimum index and an optional maximum index.

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grab({ name: q.string() }),
  q.slice(0, 8)
);
// translates to *[_type == 'pokemon']{name}[0..8]
// -> { name: string }[]
```

The second argument can be omitted to grab a single document, and the schema/types are updated accordingly.

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grab({ name: q.string() }),
  q.slice(0)
);
// -> { name: string }
```

### `q.deref`

Used to apply the de-referencing operator `->`.

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grab({
    name: q.string(),
    // example of grabbing types for a pokemon, and de-referencing to get name value.
    types: q("types", q.filter(), q.deref(), q.grabOne("name", q.string())),
  }),
);
```

### Schema Types

The `q.grab` and `q.grabOne` methods are used to "project" and select certain values from documents, and these are the methods that dictate the shape of the resulting schema/data. To indicate what type specific fields should be, we use schemas provided by the `groqd` library, such as `q.string`, `q.number`, `q.boolean`, and so on.

For example:

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grab({
    // string field
    name: q.string(),
    
    // number field
    hp: ["base.HP", q.number()],
    
    // boolean field
    isStrong: ["base.Attack > 50", q.boolean()]
  }),
);
```

The available schema types are shown below.

- `q.string`, corresponds to [Zod's string type](https://github.com/colinhacks/zod#strings).
- `q.number`, corresponds to [Zod's number type](https://github.com/colinhacks/zod#numbers).
- `q.boolean`, corresponds to [Zod's boolean type](https://github.com/colinhacks/zod#booleans).
- `q.literal`, corresponds to [Zod's literal type](https://github.com/colinhacks/zod#literals).
- `q.union`, corresponds to [Zod's union type](https://github.com/colinhacks/zod#unions).
- `q.date`, which is a custom Zod schema that can accept `Date` instances _or_ a date string (and it will transform that date string to a `Date` instance).
- `q.null`, corresponds to Zod's null type.
- `q.undefined`, corresponds to Zod's undefined type.
### `makeSafeQueryRunner`

A wrapper around `q` so you can easily use `groqd` with an actual fetch implementation. 

Pass `makeSafeQueryRunner` a "query executor" of the shape `type QueryExecutor = (query: string) => Promise<any>`, and it will return a "query runner" function. This is best illustrated with an example:

```ts
import sanityClient from "@sanity/client";
import { q } from "groqd";

// Wrap sanityClient.fetch
const client = sanityClient({ /* ... */});
export const runQuery = makeSafeQueryRunner(query => client.fetch(query));

// 👇 Now you can run queries and `data` is strongly-typed, and runtime-validated.
const data = await runQuery(
  q(
    "*",
    q.filter("_type == 'pokemon'"),
    q.grab({ name: q.string() }),
    q.slice(0, 150),
  )
);
```

### `InferType`

A type utility to extract the TypeScript type for the data expected to be returned from the query. 

```ts
import { q } from "groqd";
import type { InferType } from "groqd";

const query = q("*", q.grab({ name: q.string(), age: q.number() }));
type Persons = InferType<typeof query>; // -> { name: string; age: number; }[]
```

## FAQs

### Can `groqd` handle groq's `coalesce` operator?

**Yes!** You can write a colesce expression just as if it were a field expression. Here's an example with `groqd`:

```ts
q(
  "*",
  q.filter("_type == 'pokemon'"),
  q.grab({
    name: q.string(),
    // using `coalesce` in a `grab` call
    strength: ["coalesce(strength, base.Attack, 0)", q.number()]
  }),
);
```
