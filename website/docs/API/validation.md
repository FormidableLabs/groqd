---
sidebar_position: 6
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

For convenience, `groqd` exports a `zod` object, which contains just [Zod's validation methods](https://zod.dev/?id=primitives) that are most commonly used with GroqD.  It also contains a couple extra utilities for working with GroqD data.

This includes the following Zod methods:

- Primitives
    - `zod.string()`
    - `zod.number()`
    - `zod.boolean()`
    - `zod.null()`
    - `zod.date()`
    - `zod.literal(value)`
- Composite types
    - `zod.union([ ...types ])`
    - `zod.array(type)`
    - `zod.object({ ...schema })`

The Zod methods are chainable, like `zod.number().min(0).max(10).default(0)`.  See [their documentation](https://zod.dev/?id=primitives) for more details!

## Zod extras

In addition to the above Zod methods, a few extra helpers are included:

### `zod.default(parser, defaultValue)`

Zod's chainable `.default()` method (e.g. `zod.string().default("")`) doesn't work well with GROQ, since GROQ only returns `null` and never `undefined`.

So instead of chaining Zod's `default` method, use this `default` method instead:

```ts
// Before:
zod.number().default(0)
// After:
zod.default(zod.number(), 0)
```

```ts
q.star.filterByType("product").project({
  name: zod.default(zod.string(), "Product"),
  price: zod.default(zod.number().min(0), 0),
})
```


### `zod.slug(field)`

Shorthand for accessing the current value for a slug.

```ts
q.star.filterByType("product").project({
  // Before:
  slug: ["slug.current", z.string()],
  // After:
  slug: zod.slug("slug"),
})
```

## Nullable / NotNull

Usually, a query chain infers from your schema whether the results might be `null`.  You can override this logic by chaining the `.nullable()` or `.notNull()` assertions.

### `.nullable()`

Marks any query chain as nullable – in case the query is expecting a potential `null` value.

```ts
q.star
  .filterByType("product")
  .project(product => ({ 
    // Even though 'name' is required,
    // we might have legacy data that's missing this field,
    // so let's explicitly mark it as nullable: 
    name: product.field("name").nullable(), 
  }))
```

### `.notNull()`

Marks any query chain as NOT nullable - in case we expect the query to never result in a `null`.  This will cause an error to be thrown otherwise!

```ts
q.star
 .filterByType("product")
 .filterBy("slug.current == $slug")
 .slice(0) // the return type for `slice` is nullable by default
 .project({ name: true })
 .notNull() // but here we assert that there must be a match!
```


## Transformation

In `GroqD`, **validation** is synonymous with **transformation**.  Any field-level `validation` parameter could also be used to transform the value at runtime.  For example, the `zod.date()` validation automatically transforms an incoming `string` or `number` into a `Date`.

```ts
q.star.filterByType("product").project({
  _createdAt: zod.date(),
  // Transform a 1 => "available", 2 => "out of stock"
  status: zod.number().transform((status) => (status === 1 ? "available" : "out of stock")),
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
