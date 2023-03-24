---
sidebar_position: 3
---

# Query Building

`groqd` uses a builder pattern for building queries. Builder instances are created with a function `q`, and are chainable. There are four internal classes that are used as part of the query builder process: `UnknownQuery`, `ArrayQuery`, `UnknownArrayQuery`, and `EntityQuery`. These four classes have _some_ overlap, but generally only contain methods that "make sense" for the type of result they represent (e.g. `ArrayQuery` will contain methods that an `EntityQuery` will not, such as filtering and ordering).

## The `q` method

The entry point for the query builder, which takes a base query as its sole argument (such as `"*"`). Returns an `UnknownResult` instance to be built upon.

```ts
const { query, schema } = q("*").filter("_type == 'pokemon'");
```

This function is best used in conjunction with a "query runner" from [`makeSafeQueryRunner`](#makesafequeryrunner), such as:

```ts
import sanityClient from "@sanity/client";
import { q, makeSafeQueryRunner } from "groqd";

// Wrap sanityClient.fetch
const client = sanityClient({
  /* ... */
});
export const runQuery = makeSafeQueryRunner((query) => client.fetch(query));

// Now you can fetch your query's result, and validate the response, all in one.
const data = await runQuery(q("*").filter("_type == 'pokemon'"));
```

### Starting with an array

Sometimes your base query returns an array. `groqd` has no way of knowing when this occurs, so you'll need to give it a hint by passing `isArray: true` to the second arg of `q`.

```ts
q("*[_type == 'pokemon']", { isArray: true })
  .grab$({ name: q.string() })
```

## `.filter`

Receives a single string argument for the GROQ filter to be applied (without the surrounding `[` and `]`). Applies the GROQ filter to the query and adjusts schema accordingly.

```ts
q("*").filter("_type == 'pokemon'");
// translates to: *[_type == 'pokemon']
```

## `.filterByType`

Receives a single string argument as a convenience method to apply a GROQ filter by type. Applies a GROQ filter by type to the query and adjusts schema accordingly.

```ts
q("*").filterByType("pokemon");
// translates to: *[_type == 'pokemon']
```

## `.grab`


Available on `UnknownQuery`, `ArrayQuery`, and `EntityQuery`, handles [projections](https://www.sanity.io/docs/how-queries-work#727ecb6f5e15), or selecting fields from an existing set of documents. This is the primary mechanism for providing a schema for the data you expect to get.

`q.grab` accepts a "selection" object as its sole argument, with three different forms:

```ts
q("*").grab({
  // projection is `{ "name": name }`, and validates that `name` is a string.
  name: ["name", q.string()],

  // shorthand for `description: ['description', q.string()]`,
  //  projection is just `{ description }`
  description: q.string(),

  // can also pass a sub-query for the field,
  //  projection is `{ "types": types[]->{ name } }`
  types: q("types").filter().deref().grab({ name: q.string() }),
});
```

See [Schema Types](/schema-types) for available schema options, such as `q.string()`. These generally correspond to Zod primitives, so you can do something like:

```ts
q("*").grab({
  name: q.string().optional().default("no name"),
});
```

### Conditional selections with `.grab`

Groq offers a `select` operator that you can use at the field-level to conditionally select values, such as the following.

```ts
q("*").grab({
  strength: [
    "select(base.Attack > 60 => 'strong', base.Attack <= 60 => 'weak')",
    q.union([q.literal("weak"), q.literal("strong")]),
  ],
});
```

However, in real-world practice it's common to have an array of values of varying types and you want to select different values for each type. `.grab` allows you to do conditional selections by providing a second argument of the shape `{[condition: string]: Selection}`.

This second argument is not as flexible as the `=>` operator or `select` function in GROQ, and instead provides a way to "fork" a portion of your selection (e.g., only the base selection and _one_ of the conditional selections will be made at any give time). Here's an example.

```ts
q("*")
  // Grab _id on all pokemon
  .grab(
    {
      _id: q.string(),
    },
    {
      // And for Bulbasaur, grab the HP
      "name == 'Bulbasaur'": {
        name: q.literal("Bulbasaur"),
        hp: ["base.HP", q.number()],
      },
      // And for Charmander, grab the Attack
      "name == 'Charmander'": {
        name: q.literal("Charmander"),
        attack: ["base.Attack", q.number()],
      },
    }
  );

// The query result type looks something like this:
type QueryResult = (
  | { _id: string; name: "Bulbasaur"; hp: number }
  | { _id: string; name: "Charmander"; attack: number }
  | { _id: string }
)[];
```

In real-world Sanity use-cases, it's likely you'll want to "fork" based on a `_type` field (or something similar).

:::caution
In the example above, if you were to add `name: q.string()` to the base selection, it would break TypeScript's ability to do discriminated union type narrowing. This is because if you have a type like `{name: "Charmander"} | {name: string}` there is no way to narrow types based on the `name` field (since for discriminated unions to work, the field must have a _literal_ type).
:::

## `.grab$`

Just like `.grab`, but uses the `nullToUndefined` helper [outlined here](/utility-methods#nulltoundefined) to convert `null` values to `undefined` which makes writing queries with "optional" values a bit easier.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab$({
    name: q.string(),
    // 👇 `foo` comes in as `null`, but gets preprocessed to `undefined` so we can use `.optional()`.
    foo: q.string().optional().default("bar"),
  })
```

## `.grabOne`

Similar to `q.grab`, but for ["naked" projections](https://www.sanity.io/docs/how-queries-work#dd66cae5ed8f) where you just need a single property (instead of an object of properties). Pass a property to be "grabbed", and a schema for the expected type.

```ts
q("*").filter("_type == 'pokemon'").grabOne("name", q.string());
// -> string[]
```

## `.grabOne$`

Just like `.grabOne`, but uses the `nullToUndefined` helper [outlined below](#nulltoundefined) to convert `null` values to `undefined` which makes writing queries with "optional" values a bit easier.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grabOne$("name", q.string().optional());
```

## `.slice`

Creates a slice operation by taking a minimum index and an optional maximum index.

```ts
q("*").filter("_type == 'pokemon'").grab({ name: q.string() }).slice(0, 8);
// translates to *[_type == 'pokemon']{name}[0..8]
// -> { name: string }[]
```

:::note
Groq slices are "closed" intervals, so the maximum index is _included_ in the result. This can be a bit confusing when coming from JS `Array.slice`, since `q("*").slice(0, 8)` includes *nine* items – not eight.
:::

## `.order`

Receives a list of ordering expression, such as `"name asc"`, and adds an order statement to the GROQ query.

```ts
q("*").filter("_type == 'pokemon'").order("name asc");
// translates to *[_type == 'pokemon']|order(name asc)
```

## `.deref`

Used to apply the de-referencing operator `->`.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    name: q.string(),
    // example of grabbing types for a pokemon, and de-referencing to get name value.
    types: q("types").filter().deref().grabOne("name", q.string()),
  });
```

## `.score`

Used to pipe a list of results through the `score` GROQ function.

```ts
// Fetch first 9 Pokemon's names, bubble Char* (Charmander, etc) to the top.
q("*")
  .filter("_type == 'pokemon'")
  .slice(0, 8)
  .score(`name match "char*"`)
  .order("_score desc")
  .grabOne("name", z.string());
```


## `.nullable`

A method on the base query class that allows you to mark a query's schema as nullable – in case you are expecting a potential null value.

```ts
q("*")
  .filter("_type == 'digimon'")
  .slice(0)
  .grab({ name: q.string() })
  .nullable(); // 👈 we're okay with a null value here
```

