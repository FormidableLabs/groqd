
# Migrating from GroqD v0.x to Groq-Builder v0.x 

## Fundamental differences

With `GroqD v0.x`, we use Zod to validate our queries at runtime.

With `groq-builder`, <!-- TODO: replace this with `groqd v1` -->
by adding a strongly-typed Sanity schema, we can validate our queries at compile-time.  Runtime validation is now optional, and we no longer bundle Zod.

## Simple migration example

#### Before, with `groqd`

```ts
import { q } from "groqd";

const productQuery = q("*")
  .filterByType("product")
  .grab({
    name: q.string(),
    price: q.number(),
    slug: ["slug.current", q.string().optional()]
  });
```

#### After, with `groq-builder`

```ts
import { createGroqBuilderWithValidation } from "groq-builder/validation";
const q = createGroqBuilderWithValidation<any>(); // Using 'any' makes the query schema-unaware 

const productQuery = q.star
  .filterByType("product")
  .grab({
    name: q.string(),
    price: q.number(),
    slug: [ "slug.current", q.string().optional() ],
  });
```

To make migration as easy as possible, the `groq-builder/validation` path includes simple Zod-like validation methods, like `q.string()`.

In this simple example, migration only required 2 changes:
1. Create the root `q`, setting the schema to `any`
2. Change `q("*")` to `q.star`

## Important differences

### `q("...")`
In GroqD, `q` is a function that accepts any Groq query.  
In `groq-builder`, `q` must be chained to form a query.

These are the most common changes needed:
- `q("*")` becomes `q.star`
- `q("fieldName")` becomes `q.field("fieldName")`


### `q.select(...)`
This is not yet supported by `groq-builder`.  

### Validation methods

Most validation methods, like `q.string()` or `q.number()`, are no longer powered by Zod, but they work just the same.  Use Zod if you want to have extra validation logic, like email validation, ranges etc.

Some validation methods, like `q.object()` and `q.array()`, are much simpler than the Zod version.  These check that the data is an `object` or an `Array`, but do NOT check the shape of the data.  Use Zod to validate an object's shape, or the items inside an Array.


### Upgrading to use a strongly-typed schema 
```ts
import { createGroqBuilder } from "groq-builder";
import { MySanityConfig } from "./my-sanity-config";
const q = createGroqBuilder<MySanityConfig>();

const productQuery = q.star
  .filterByType("product")
  .project({
    name: true,
    price: true,
    slug: "slug.current",
  });
```
Note the following changes:
1. `grab` was renamed to `project`
2. We do not need to explicitly specify the types for `name`, `price`, or `slug.current`; these are all inferred from the Sanity Schema.

The output type is exactly the same as before.  However, we no longer have runtime validation; we now rely on the schema configuration during compile time.
