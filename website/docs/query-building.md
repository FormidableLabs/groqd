---
sidebar_position: 3
---

# Query Building

`groqd` uses a builder pattern for building queries. Builder instances are created with a function `q`, and are chainable. There are four internal classes that are used as part of the query builder process: `UnknownQuery`, `ArrayQuery`, `UnknownArrayQuery`, and `EntityQuery`. These four classes have _some_ overlap, but generally only contain methods that "make sense" for the type of result they represent (e.g. `ArrayQuery` will contain methods that an `EntityQuery` will not, such as ordering).

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

Sometimes your base query returns an array. `groqd` has no way of knowing when this occurs, so you'll need to give it a hint by passing `isArray: true` to the second arg of `q`. The `isArray` option only changes the return type of `q()` to `ArrayQuery` so the TS types can be more accurately represented. It _does not_ change the actual output query.

```ts
q("*[_type == 'pokemon']", { isArray: true })
  .grab$({ name: q.string() })
// translates to: *[_type == 'pokemon']
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

Grab accepts a second "Conditions" argument that comes in the shape `{ [condition: string]: Selection }` . You can use this to create a union of possible selections that are merged with the base selection.

```ts
const pokemonQuery = q(*).filterByType('pokemon').grab(
  // Base selection
  {
    _key: q.string(),
    name: q.string()
  },
  // Conditional selections
  {
    'base.Attack > 60': {
      attack: 'strong',
      hp: ['base.HP', q.number()] 
    },
    'base.Attack <= 60': {
      attack: 'weak',
      defense: ['base.Defense', q.number()] 
    }
  }
)

type SanityPokemon = InferType<typeof pokemonQuery>
//    ^? (
//         | { _key: string; name: string; }
//         | { _key: string; name: string; attack: 'strong'; hp: number}
//         | { _key: string; name: string; attack: 'weak'; defense: number}
//       )[]
```

If you find that you are using the conditional argument with an empty base selection, we recommend using the [.select](/query-building#select) method instead.

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

## `.select`

GROQ offers a `select` operator that you can use at the field-level to conditionally select values, such as the following.

```
*{
  "strength": select(
    base.Attack > 60 => 'strong',
    base.Attack <= 60 => 'weak'
  )
}
```

Groqd provides a `.select` method to mirror this operator. This method provides field-level access exposed directly through `q`, while also providing entity level access exposed through the `EntityQuery` & `ArrayQuery` classes. The above query would be implemented like so.

```ts
q('*').grab({
  strength: q.select({
    'base.Attack > 60': ['"strong"', q.literal('strong')],
    'base.Attack <= 60': ['"weak"', q.literal('weak')]
  })
})
```

### Args

`q.select` accepts a "Conditions" object as its sole argument, with conditions in one of three different forms:

```ts
q('*').select({
  // Takes a raw [queryString, zodType] tuple. Creates the query string `base.Attack > 60 => name`
  'base.Attack > 60': ['name', q.string()]

  // Takes the "Selection" object used in `.grab` to create a projection. Creates the query string `base.Attack <= 60 => { name }`
  'base.Attack < 60': { name: q.string() }

  // Takes a sub-query for the condition. Creates the query string `base.Attack == 60 => types[]->{ name }`
  'base.Attack == 60': q("types").filter().deref().grab({ name: q.string() })
})
```

Similar to Groq's select operator, the `q.select` method also takes a `default` condition. If omitted, the condition `{ default: ['null', q.null()] }` will be appended to the supplied conditions.

:::note
If used on an `EntityQuery` or `ArrayQuery` the select operator is spread into an entity context and will convert any primitives into an empty object (including the `{ default: null }` condition if the default condition is omitted). This is why you often see empty objects show up in union types resulting from conditional selections.
:::

### "Fork" a selection based on a `_type`

While some may find the flexibilty of `.select` useful, the most common Sanity use-cases center around modeling schema with an array of varying types. `.select` allows you to "_fork_" your selection (only _one_ of the conditional selections will be made at any give time) and create a union of possible results. Here's an example.

```ts
q("*").filter().select({
  // For Bulbasaur, grab the HP
  'name == "Bulbasaur"': {
    _id: q.string(),
    name: q.literal("Bulbasaur"),
    hp: ["base.HP", q.number()],
  },
  // For Charmander, grab the Attack
  'name == "Charmander"': {
    _id: q.string(),
    name: q.literal("Charmander"),
    attack: ["base.Attack", q.number()],
  },
  // For all other pokemon, cast them into an unsupported selection
  // while retaining useful information for run-time logging
  default: {
    _id: q.string(),
    name: ['"unsupported pokemon"', q.literal("unsupported pokemon")],
    unsupportedName: ['name', q.string()]
  }
});

// The query result type looks like this:
type QueryResult = (
  | { _id: string; name: "Bulbasaur"; hp: number }
  | { _id: string; name: "Charmander"; attack: number }
  | { _id: string; name: "unsupported pokemon"; unsupportedName: string }
)[];
```

:::note
It is best practice to only provide conditions for supported types and cast the `default` condition as an unsupported selection. Making the `default` condition one of
your supported return types can often introduce brittleness in your run-time validation. 

This practice becomes evident when you add a new "_fork_" to content you have previously written a `select` query for. In that scenario, the ideal behavior is that the application
does not fail run-time validation, and simply logs the unsupported type.
:::

### Composing large queries

It is often the case that we want to break up our queries into more atomic pieces and compose them in larger queries later on (similar to the way we compose Sanity schema with components and documents). With this in mind, `ArrayQuery.select` & `EntityQuery.select` can accept a field level `q.select` in place of a "Conditions" argument.

This is useful when you have a Sanity component that consists of several "_forked_" types, that you later re-use in document level fields.

Lets take the previous pokemon example above and apply this technique to it.

```ts
// @/components/pokemon.tsx
import { q, type InferType } from 'groqd';

export const pokemonSelect = q.select({
  'name == "Bulbasaur"': {
    _id: q.string(),
    name: q.literal("Bulbasaur"),
    hp: ["base.HP", q.number()],
  },

  'name == "Charmander"': {
    _id: q.string(),
    name: q.literal("Charmander"),
    attack: ["base.Attack", q.number()],
  },

  default: {
    _id: q.string(),
    name: ['"unsupported pokemon"', q.literal("unsupported pokemon")],
    unsupportedName: ['name', q.string()]
  }
});

export default function Pokemon({ pokemon }: { pokemon: InferType<typeof pokemonSelect> }) {
  switch (pokemon.name) {
    case 'Bulbasaur': 
      return <Bulbasaur {...pokemon} />;

    case 'Charmander': 
      return <Charmander {...pokemon} />;

    case 'unsupported pokemon': 
    default:
      console.error(`unsupported pokemon type ${pokemon.unsupportedName}`)
      return null;
  }
}

// @/components/pokedex.tsx
import { pokemonSelect } from '@/components/pokemon'

const pokedexQuery = q('*').filterByType('Pokedex').grab({
  _key: q.string(),

  owner: q('owner')
    .deref()
    .grabOne('name', q.string()),

  pokemon: q('pokemon')
    .filter()
    .deref()
    .select(pokemonSelect)
})
/**
 * Resulting query string is:
 * ```groq
   *[_type == 'Pokedex']{
    _key,
    owner->name,
    pokemon[]->{
      ...select(
        name == "Bulbasaur" => {
          _id,
          name,
          "hp": base.HP
        },
        name == "Charmander" => {
          _id,
          name,
          "attack": base.Attack
        },
        {
          _id,
          "name": "unsupported pokemon",
          "unsupportedName": name
        }
      )
    }
   }
 * ```
 */
```

:::note
Types will differ slightly between `q.select` and `(ArrayQuery | EntityQuery).select`. With `(ArrayQuery | EntityQuery).select` possible selections are spread into the entity context `entity{ ...select() }`, so if any primitives are returned from an entity level select, they will be transformed into an empty object when spread.

If you run into this type mismatch when mapping component prop types to broader query types, it's recommended to encompass the select in an entity query when deriving the type to account
for it being spread in larger queries

```ts
type someProperty = InferType<typeof q("").select(somePropertySelect)>
```
:::

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

:::note
When using a subquery it can be easy to mistake using the `isArray` option for selecting the array in the GROQ query. The following subqueries produce the same output and show the correct way to dereference an array as a subquery.

By using array select

```ts
hosts: q('hosts[]', { isArray: true })
  .deref()
  .grab({
      _id: q.string(),
      name: q.string(),
  }),

// translates to "hosts": hosts[]->{ _id,  name }
```

Or by using an empty `filter` method

```ts
hosts: q('hosts')
  .filter()
  .deref()
  .grab({
      _id: q.string(),
      name: q.string(),
  }),

// translates to "hosts": hosts[]->{ _id,  name }
```
:::

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
