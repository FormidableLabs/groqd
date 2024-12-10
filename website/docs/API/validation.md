---
sidebar_position: 26
---

# Validation

## Zod methods

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

## Zod Extras:

In addition to the above Zod methods, a few extra validation methods are included:

### `q.default(parser, defaultValue)`

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



### `q.slug(field)`

Shorthand for accessing the current value for a slug.

```ts
q.star.filterByType("product").project({
  // Before:
  slug: ["slug.current", z.string()],
  // After:
  slug: q.slug("slug"),
})
```

### `q.value(literal, parser?)`

Selects a literal value. Especially useful with [conditional selections](api-advanced.md#conditionals).

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

## `.nullable()`

Marks a query as nullable – in case you are expecting a potential `null` value.

```ts
q.star
  .filterByType("product")
  .slice(0)
  .project({ name: q.string() })
  .nullable(); // 👈 we're okay with a null value here
```
