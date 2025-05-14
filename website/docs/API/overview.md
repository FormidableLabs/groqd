---
sidebar_position: 0
---

# Overview

## The root `q` object

The `q` object (created in the [Configuration](../configuration) section) has 3 main purposes:

### Start a query chain

All query chains start with either `q.star` or `q.project(...)`.
All methods of a query chain return a new chainable instance of `GroqBuilder`.  Every chain is immutable, and can be reused if needed.

See the [Filters](./filters) and [Projections](./projections) documentation for more details.

### Create reusable fragments

You can also define reusable "projection fragments" using the `q.fragment<T>()` method.

See the [Fragments documentation](./fragments) for more details.

### Provide GROQ functions

The root `q` object provides various wrappers for GROQ functions,
like `q.count(...)`, `q.coalesce(...)` and `q.select(...)`.

See the [GROQ Functions documentation](./functions) for more details.


## An example query

```ts
const top10ProductsQuery = (
   q.star
    .filterByType("product")
    .order("price asc")
    .slice(0, 10)
    .project(sub => ({
      title: z.string(),
      price: z.number(),
      images: sub.field("images[]").field("asset").deref().project({
        url: z.string(),
        altText: z.string(),
      })
    }))
);
```
