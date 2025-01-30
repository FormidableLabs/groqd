---
sidebar_position: 5
---

# Query Parameters

Many queries have input parameters, such as `$slug` or `$limit`.

`GroqD` requires you to define these parameters before using them, using the `.parameters` method. This method has no runtime effects; it's only used for defining types.

Defining your parameters enables 2 great features:

- Strongly-typed methods (eg. `filterBy`) can reference these parameters.
- The parameters will be required when executing the query.

## `.parameters<Params>()`

Defines the names and types of parameters that must be passed to the query.

```ts
const productsBySlug = (
  q.parameters<{ slug: string }>()
   .star.filterByType("product")
   // You can now reference the $slug parameter:
   .filterBy("slug.current == $slug")
);
```

These parameters are now required by `runQuery`:

```ts
const results = await runQuery(
  productsBySlug,
  // The 'slug' parameter is required:
  { parameters: { slug: "123" } }
)
```

