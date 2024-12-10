---
sidebar_position: 20
---

# Overview

## The root `q` object

The `q` object (created in the [Configuration](../configuration) section) has 3 main purposes:

1. Start a query chain, using `q.star` or `q.project(...)`
2. Provide all of Zod's validation functions, like `q.string()` and `q.number()`.  These are identical to `zod.string()` and `zod.number()`, and are added to the `q` object for convenience.
3. Creating reusable fragments, using `q.fragment<...>()`.  See [the Fragments documentation for more details](./fragments)

All GroqD methods return a new chainable instance.  Chains are immutable, so they can be reused if needed.



## Additional GroqD methods

These utilities are GroqD-specific, and do not correspond to GROQ features.


### `.parameters<Params>()`

Defines the names and types of parameters that must be passed to the query. 

This method is just for defining types; it has no runtime effects. However, it enables 2 great features: 

- Strongly-typed methods (eg. `filterBy`) can reference these parameters.
- The parameters will be required when executing the query.

```ts
const productsBySlug = (
  q.parameters<{ slug: string }>()
   .star.filterByType("product")
   // You can now reference the $slug parameter:
   .filterBy("slug.current == $slug")
);
const results = await runQuery(
  productsBySlug,
  // The 'slug' parameter is required:
  { parameters: { slug: "123" } }
)
```

### `.transform(parser)`

Manually adds a transformation (or validation) to the query results.  

```ts
q.star.filterByType("product").project(sub => ({
  created: sub.field("_createdAt").transform(str => new Date(str)),
}))
```
Also aliased as `.validate(parser)` for semantic reasons.


### `.raw(expression, parser?)`

An "escape hatch" allowing you to write any GROQ query you want.

This should only be used for unsupported features, since it bypasses all strongly-typed inputs.

```ts
q.star.filterByType("product").project({
  imageCount: q.raw("count(images[])", q.number())
})
```


<!--

##### `.select`
    
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
    
    #### Args
    
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
    
    #### "Fork" a selection based on a `_type`
    
    While some may find the flexibilty of `.select` useful, the most common Sanity use-cases center around modeling schema with an array of varying types. `.select` allows you to "_fork_" your selection (only _one_ of the conditional selections will be made at any give time) and create a union of possible results. Here's an example.
    
    ```ts
    q.star.filter().select({
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
    
    #### Composing large queries
    
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
    

    
-->
