---
sidebar_position: 22
---

# API

## The root `q` object

The `q` object (created in the [Configuration](./configuration) section) has 3 main purposes:

1. Start a query chain, using `q.star` or `q.project(...)`
2. Provide all of Zod's validation functions, like `q.string()` and `q.number()`.  These are identical to `zod.string()` and `zod.number()`, and are added to the `q` object for convenience.
3. Creating reusable fragments, using `q.fragment<...>()`.  See [the Fragments documentation for more details](./api-advanced#fragments)

All GroqD methods return a new chainable instance.  Chains are immutable, so they can be reused if needed.

## Filtering Methods

### `.star`

Selects all documents, via GROQ's `*` selector.
This is how most queries start.

```ts
q.star.filter(...).project(...)
```

### `.filterByType(type)`

Filters the query based on the document type.  
Supports multiple type arguments.

```ts
q.star.filterByType("pokemon");
// Result GROQ: *[_type == "pokemon"]
// Result Type: Pokemon[]
```

### `.filterBy(expression)`

Filters the query based on a GROQ expression.  
The `expression` is a strongly-typed string, but only supports simple equality expressions. 

```ts
q.star
 .filterByType("product")
 .filterBy('category == "shoe"')
```

> For more complex expressions, use `.filter(expression)`:


### `.filter(expression)`

Filters the query based on **any** GROQ expression.

> ⚠️ This method allows any GROQ `string`, and the syntax is not checked.  Please use `.filterBy` for strongly-typed expressions.

```ts
q.star
 .filterByType("product")
 .filter("price >= 50");
// Result GROQ: *[_type == "product"][price >= 50]
// Result Type: Product[]
```

### `.order(field)`

Orders the results using a strongly-typed expression, such as `"name asc"` or `"slug.current desc"`.  Supports multiple sort expressions.

```ts
q.star
 .filterByType("product")
 .order("price asc", "slug.current desc")
// Result GROQ: *[_type == "product"] | order(price asc, slug.current desc)
// Result Type: Product[]
```

<!--    
    ### `.score(expression)`
    ### `.score(expression)`
    
    Used to pipe a list of results through the `score` GROQ function.
    
    ```ts
    // Fetch first 9 Pokemon's names, bubble Char* (Charmander, etc) to the top.
    q.star
      .filter("_type == 'pokemon'")
      .slice(0, 8)
      .score(`name match "char*"`)
      .order("_score desc")
      .grabOne("name", z.string());
    ```
-->



### `.slice(index)`

Returns a single item from the results, based on the index.

```ts
q.star
 .filterByType("product")
 .slice(0)
// Result GROQ: *[_type == "product"][0]
// Result Type: Product
```

### `.slice(start, end, inclusive = false)`

Returns a range of items from the results.  
If `inclusive` is set, the `end` item will be included.

```ts
q.star
 .filterByType("product")
 .slice(10, 20)
// Result GROQ: *[_type == "product"][10...20]
// Result Type: Product[]
```

## Projections

In GROQ, **projections** are how we select the data we want returned. 

### `.project(sub => ProjectionMap)`

The `sub` parameter is a strongly-typed GroqBuilder, so it knows the names and types of the fields in the current filters.

The `ProjectionMap` is an object that maps keys to queries.

Example:

```ts
q.star.filterByType("product").project(sub => ({
  imageUrl: sub.field("image").deref().field("url", q.string()),
  slug: sub.field("slug.current", q.string()),
  price: sub.field("price", q.number()),
}))
// Result GROQ: 
//   *[_type == "product"]{
//     "imageUrl": image->url,
//     "slug": slug.current,
//     price,
//   }
```

### Shorthand Syntax

Since it's extremely common to select a field, there are several shorthand methods to make this easy!  The fields above could be rewritten as follows:

```ts
  slug: ["slug.current", q.string()],
  price: q.number(), // (when the key and field names are the same)
```

Since runtime validation is optional, you could also omit the validation functions, and use this very short syntax:
```ts
  slug: "slug.current",
  price: true,
```

Finally, if you're only using these shorthands, and you're NOT using the `sub` parameter at all, you can remove it, and everything will still be strongly-typed:
```ts
q.star.filterByType("product").project({
  slug: ["slug.current", q.string()],
  price: q.number(), 
})
```

### `.field(fieldName, parser?)`

Sanity calls this a "naked projection". This selects a single field from the object.

```ts
// Select all product names:
q.star.filterByType("product").field("name", q.string())
// Result GROQ: *[_type == "product"].name
// Result Type: Array<string>
```

### `.deref()`

Uses GROQ's dereference operator (`->`) to follow a reference.

```ts
q.star
 .filterByType("product")
 .field("image").deref().field("url")
// GROQ: *[_type == "product"].image->url
```

```ts
q.star.filterByType("product").project(sub => ({
  category: sub.field("category").deref().field("title"),
  images: sub.field("images[]").deref().project({
    url: q.string(),
    width: q.number(),
    height: q.number(),
  }),
}))
// GROQ: *[_type == "product"]{
//  "category": category->title,
//  "images": images[]->{ url, width, height }
// }
```


## Validation methods

### Zod methods

The root `q` object contains many of [Zod's validation methods](https://zod.dev/?id=primitives). This is purely for convenience; `q.string()` is identical to `zod.string()`.

This includes the following Zod methods:

- Primitives
  - `q.string()`
  - `q.number()`
  - `q.boolean()`
  - `q.null()`
  - `q.date()`
  - `q.literal(value)`
- Composite types
  - `q.union([ ...types ])`
  - `q.array(type)`
  - `q.object({ ...schema })`

The Zod methods are chainable, like `q.number().min(0).max(10).default(0)`.

### Zod Extras: 

In addition to the above Zod methods, a few extra validation methods are included:

#### `q.default(parser, defaultValue)`

Zod's chainable `.default()` method doesn't work well with GROQ, since GROQ only returns `null` and never `undefined`.

So instead of chaining Zod's `default` method, use this `default` method instead.

```ts
// Before:
q.number().default(0)
// After:
q.default(q.number(), 0)
```

```ts
q.star.filterByType("product").project({
  name: q.default(q.string(), "Product"),
  price: q.default(q.number().min(0), 0),
})
```



#### `q.slug(field)`

Shorthand for accessing the current value for a slug.

```ts
q.star.filterByType("product").project({
  // Before:
  slug: ["slug.current", z.string()],
  // After:
  slug: q.slug("slug"),
})
```

#### `q.value(literal, parser?)`

Selects a literal value. Especially useful with [conditional selections](./api-advanced#conditionals).

> Not to be confused with `q.literal(literal)` which is a Zod validation function.

```ts
q.star.filterByType("product").project({
  a: q.value("LITERAL"),
  b: q.value(true),
  c: q.value(42),
})
// Result GROQ: *[_type == "product"]{
//  "a": "LITERAL",
//  "b": true,
//  "c": 42,
// }
```

### `.nullable()`

Marks a query as nullable – in case you are expecting a potential `null` value.

```ts
q.star
  .filterByType("product")
  .slice(0)
  .project({ name: q.string() })
  .nullable(); // 👈 we're okay with a null value here
```

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
