# `safe-groq` (🧪experimental🧪)

## Introduction

`safe-groq` is a schema-unaware, runtime-safe query builder for [GROQ](https://www.sanity.io/docs/groq). The goal of `safe-groq` is:

- Allow you to generate a GROQ query _and_ associated [Zod](https://github.com/colinhacks/zod) schema with a single DSL. Use the query with your GROQ client, and use the schema to parse the response for runtime/type safety.
- Limit GROQ's flexibility as little as reasonably possible.

An illustrative example:

```ts
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

TODO: show example of creating a sanityClient wrapper fn.

## API:

TODO:

## FAQ

- Why schema-unaware?
- 
