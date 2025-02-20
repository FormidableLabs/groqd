---
sidebar_position: 4
---

# Projections

In GROQ, **projections** are how we select the data we want returned.

## The `.project` method

### `.project(sub => ProjectionMap)`

The `sub` parameter is a strongly-typed GroqBuilder, so it knows the names and types of the fields in the current filters.

The `ProjectionMap` is an object that maps keys to queries.

Example:

```ts
q.star.filterByType("product").project(sub => ({
  imageUrl: sub.field("image.asset").deref().field("url", zod.string()),
  slug: sub.field("slug.current", zod.string()),
  price: sub.field("price", zod.number()),
}))
// Result GROQ: 
//   *[_type == "product"]{
//     "imageUrl": image->url,
//     "slug": slug.current,
//     price,
//   }
```

### Shorthand Syntax Options

Since it's extremely common to select a field, there are several shorthand methods to make this easy!  The fields above could be rewritten as follows:

```ts
  slug: ["slug.current", zod.string()],
  price: zod.number(), // (when the key and field names are the same)
```

Since runtime validation is optional, you could also omit the validation functions, and use this very short syntax:
```ts
  slug: "slug.current",
  price: true,
```

Finally, if you're only using these shorthands, and you're NOT using the `sub` parameter at all, you can remove it, and everything will still be strongly-typed:
```ts
q.star.filterByType("product").project({
  slug: ["slug.current", zod.string()],
  price: zod.number(), 
})
```

### The ellipsis operator `...`

You can use the ellipsis operator in a projection as follows:

```ts
q.star.filterByType("product").project(sub => ({
  "...": true,
}))
// GROQ: *[_type == "product"]{ ... }
// Type: Array<Product>
```

This approach does have strongly-typed results.  
However, it does NOT have runtime validation, so the results are not **guaranteed** to match the schema.  This could result in downstream errors that are harder to debug.  So please take this into consideration when using the `...` operator.

## Selecting Values

### `.field(fieldName, parser?)`

Sanity calls this a "naked projection". This selects a single field from the object.

```ts
// Select all product names:
q.star.filterByType("product").field("name", zod.string())
// Result GROQ: *[_type == "product"].name
// Result Type: Array<string>
```

### `.deref()`

Uses GROQ's dereference operator (`->`) to follow a reference.

```ts
q.star
 .filterByType("product")
 .field("image.asset").deref().field("url")
// GROQ: *[_type == "product"].image->url
```

```ts
q.star.filterByType("product").project(sub => ({
  category: sub.field("category").deref().field("title"),
  images: sub.field("images[]").field("asset").deref().project({
    url: zod.string(),
    altText: zod.string(),
  }),
}))
// GROQ: *[_type == "product"]{
//  "category": category->title,
//  "images": images[]->{ url, width, height }
// }
```

### `q.value(literal, parser?)`

Selects a literal value. Especially useful with [conditional selections](./conditionals).

> Not to be confused with `zod.literal(literal)` which is a Zod validation function that can be used together.

```ts
q.star.filterByType("product").project({
  a: q.value("LITERAL"),
  b: q.value(true),
  c: q.value(42, zod.number()), // Validation is optional
  d: q.value("VALIDATED", zod.literal("VALIDATED")),
})
// Result GROQ: *[_type == "product"]{
//  "a": "LITERAL",
//  "b": true,
//  "c": 42,
//  "d": "VALIDATED",
// }
```


### `.raw(expression, parser?)`

An "escape hatch" allowing you to write any GROQ query you want.

This should only be used for unsupported features, since it bypasses all strongly-typed inputs.

```ts
q.star.filterByType("product").project({
  imageCount: q.raw("count(images[])", zod.number())
})
```
