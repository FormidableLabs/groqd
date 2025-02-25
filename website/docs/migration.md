---
sidebar_position: 19
---

# Migrating from v0.x to v1.x

Migrating from `v0.x` is straightforward, since there are only a few API changes.  Follow this guide to upgrade to the latest version.

## Configuration

Obviously, you'll start by installing the latest version:

```sh
npm install --save groqd@latest
```

### Create a `groqd-client.ts` file

The root `q` object is no longer exported by GroqD.  Instead, you'll need to create it yourself:

Create a file `./groqd-client.ts` with these contents:
```ts
import { createGroqBuilder } from 'groqd';
type SchemaConfig = any; // TODO: use generated Sanity Schema types
export const q = createGroqBuilderWithZod<SchemaConfig>();
```

By creating the root `q` this way, we'll be able to bind it to our `SchemaConfig`.  
We'll bind it to `any` for now, so our `q` will be schema-unaware -- same as `v0.x`.  

> Later, you should take a look at the [Configuration](./configuration) docs to see how to generate a strongly-typed schema from your Sanity configuration.


## Update all imports

Update all `q` imports to point to this new `./groqd-client` file:

### Example

#### Before

```ts
import { q } from 'groqd';
```

#### After
```ts
import { q } from "./groqd-client";
```

## Migrate from the `q("...")` method

With `v0.x`, the root `q` was a **function** that allowed any Groq string to be passed.

With `v1.x`, all queries must be chained, using these type-safe methods.

### Use `q.star` instead of `q("*")`

### Use `q.field("name")` instead of `q("name")`

### Use `q.raw("....")` instead of `q("....")` 

The `q.raw` function should be used for more complex expressions.

### Example

#### Before

```ts
q("*").grab({
  title: q("title", q.string()),
  itemsCount: q("count(items[])", q.number()),
});
```

#### After
```ts
q.star.grab({
  title: q.field("title", q.string()),
  itemsCount: q.raw("count(items[])", q.number()),
})
```

GroqD does not have strongly-typed helpers for all GROQ expressions, so the `q.raw` method can be used for complex expressions.


## Extra: migrate from deprecated methods

The `grab`, `grabOne`, `grab$`, and `grabOne$` methods still exist, but have been deprecated, and should be replaced with the `project` and `field` methods.

Sanity's documentation uses the word "projection" to refer to grabbing specific fields, so we have renamed the `grab` method to `project` (pronounced *pruh-JEKT*, if that helps).  
Sanity also uses the phrase "naked projection" to refer to grabbing a single field, but to keep things terse, we've renamed `grabOne` to `field`.  So we recommend migrating from `grab` to `project`, and from `grabOne` to `field`.


### Use `project` instead of `grab`

The API is nearly identical, so simply change `.grab` to `.project`.

One caveat: `grab` supports a 2nd argument for "conditional projections".  This is now handled by the `q.conditional(...)` utility.  Please see the [Conditionals](./API/conditionals) documentation for more information.

### Use `field` instead of `grabOne`

The API is identical, so simply change `.grabOne` to `.field`.

### Alternatives to `grab$` and `grabOne$`

Regarding `grab$` and `grabOne$`, these 2 variants were needed to improve compatibility with Zod's `.default(...)` utility.

This feature has been dropped, in favor of using the new `q.default` utility. 


### Example

#### Before
```
q.grab$({
  title: q.string().default("DEFAULT"),
  imageUrls: q("images[].asset").deref().grabOne("url"),
})
```

#### After
```
q.project({ 
  title: q.default(q.string(), "DEFAULT")),
  imageUrls: q.field("images[].asset").deref().field("url"),
})
```

## Extra: add a Strongly Typed Schema

With `v0.x`, we use Zod to define the shape of our queries, and validate this shape at runtime.

With `v1.x`, by [adding a strongly-typed Sanity schema](./configuration), we can validate our queries at compile-time too. This makes our queries:

- Easier to write (provides auto-complete)
- Safer to write (all commands are type-checked, all fields are verified)
- Faster to execute (because runtime validation can be skipped)

For example, in a projection, we can skip runtime validation by simply using `true` instead of a validation method like `z.string()`.  For example:
```ts
const productsQuery = q.star
  .filterByType("product")
  .project({
    name: true, // 👈 'true' will bypass runtime validation
    price: true, // 👈 and we still get strong result types from our schema
    slug: "slug.current", // 👈 a naked projection string works too!
  });
```

Since `q` is strongly-typed to our Sanity schema, it knows the types of the product's `name`, `price`, and `slug.current`, so it outputs a strongly-typed result.  And assuming we trust our Sanity schema, we can skip the overhead of runtime checks.

