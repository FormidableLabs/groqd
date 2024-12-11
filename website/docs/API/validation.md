---
sidebar_position: 26
---

# Validation

In Sanity, there are no guarantees that your data matches your schema.  The Data Lake can contain draft content, migrated content, and legacy data.

One key feature of `GroqD` is that it provides an easy way to **validate** the data coming from your queries.  It gives you extremely helpful error messages, letting you update your query to account for the mismatched data.  And ultimately, it gives you TypeScript types that you can trust.

This runtime validation is powered by Zod.  Whenever querying a field, we pass a Zod validation function to verify the results.

## Where to use validation methods

The all field-level methods utilize a `validation` parameter:
- `.project({ field: validation })`
- `.project({ key: ["field", validation] })`
- `.field("field", validation?)`
- `.raw(groq, validation?)`
- `.transform(validation)`


## Supported Zod methods

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

## Zod extras

In addition to the above Zod methods, a few extra helpers are included:

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

### `.nullable()`

Marks any query chain as nullable – in case the query is expecting a potential `null` value.

```ts
q.star
  .filterByType("product")
  .slice(0)
  .project({ name: q.string() })
  .nullable(); // 👈 we're okay with a null value here
```


## Transformation

In `GroqD`, **validation** is synonymous with **transformation**.  Any field-level `validation` parameter could also be used to transform the value at runtime.  For example, the `q.date()` validation automatically transforms an incoming `string` or `number` into a `Date`.

```ts
q.star.filterByType("product").project({
  _createdAt: q.date(),
  // Transform a 1 => "available", 2 => "out of stock"
  status: q.number().transform((status) => (status === 1 ? "available" : "out of stock")),
})
```

This works well for single fields, and you can also transform the results of an entire query:

### `.transform(parser)`

Manually adds a transformation to the query results.

```ts
q.star.filterByType("product").project(sub => ({
  created: sub.field("_createdAt").transform(str => new Date(str)),
}))
```

The `.transform` method is also aliased as `.validate` for semantic reasons. 
