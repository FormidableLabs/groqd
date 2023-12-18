# Migrating from GroqD v0.x to Groq-Builder v0.x 
<!-- TODO: rename `Groq-Builder v0.x` to `groqd v1` throughout this document -->

## Minimal Migration Example

Migrating from `groqd` to `groq-builder` is straightforward, since there are few API changes.
Here's an example of a simple `groqd` query, and the **minimum** changes required to migrate to `groq-builder`:

#### Before, with `groqd`

```ts
import { q } from "groqd";

const productsQuery = q("*")
  .filterByType("product")
  .order('price asc')
  .slice(0, 10)
  .grab({
    name: q.string(),
    price: q.number(),
    slug: ["slug.current", q.string().optional()],
    image: q("image").deref(),
  });
```

#### After, with `groq-builder`

```ts
import { createGroqBuilderWithValidation } from "groq-builder";
const q = createGroqBuilderWithValidation<any>(); // Using 'any' makes the query schema-unaware 

const productsQuery = q.star
  .filterByType("product")
  .order('price asc')
  .slice(0, 10)
  .grab({
    name: q.string(),
    price: q.number(),
    slug: ["slug.current", q.string().optional()],
    image: q.field("image").deref(),
  });
```

In this minimal example, we made 3 changes:
1. We created the root `q` object, binding it to a schema (or `any` to keep it schema-unaware).
2. We changed `q("*")` to `q.star`
3. We changed `q("image")` to `q.field("image")`

Keep reading for a deeper explanation of these changes.

## Step 1: Creating the root `q` object

```ts
// src/queries/q.ts
import { createGroqBuilder } from 'groq-builder';
type SchemaConfig = any;
export const q = createGroqBuilder<SchemaConfig>();
```

By creating the root `q` this way, we're able to bind it to our `SchemaConfig`.  
By using `any` for now, our `q` will be schema-unaware (same as `groqd`).  
Later, we'll show you how to change this to a strongly-typed schema.


## Step 2: Replacing the `q("...")` method

This is the biggest API change. 
With `groqd`, the root `q` was a function that allowed any Groq string to be passed.
With `groq-builder`, all queries must be chained, using the type-safe methods.

The 2 most common changes needed will be changing all `q("*")` into `q.star`, and changing projections from `q("name")` to `q.field("name")`.

For example:
```ts
// Before:
q("*").grab({
  imageUrl: q("image"),
});

// After:
q.star.grab({
  imageUrl: q.field("image"),
})
```

If you do have more complex query logic inside a `q("...")` function, you should refactor to use chainable methods.  
However, if you cannot refactor at this time, you can use the `raw` method instead:

## Step 3. An escape hatch: the `raw` method

Not all Groq queries can be strongly-typed. Sometimes you need an escape hatch; a way to write a query, and manually specify the result type.
The `raw` method does this by accepting any Groq string. It requires you to specify the result type.  For example:

```ts
q.raw<{ itemCount: number }>(`
  { 
    "itemCount": count(*[_type === "item"])
  }
`);
```

Ideally, you could refactor this to be strongly-typed, but you might use the escape hatch for unsupported features, or for difficult-to-type queries.


## Adding a Strongly Typed Schema

With `GroqD v0.x`, we use Zod to define the shape of our queries, and validate this shape at runtime.

With `groq-builder`, by [adding a strongly-typed Sanity schema](./README.md#schema-configuration), we can validate our queries at compile-time too. This makes our queries:

- Easier to write (provides auto-complete)
- Safer to write (all commands are type-checked, all fields are verified)
- Faster to execute (because runtime validation is now optional)

For example, by passing `true` in place of our validation methods, we skip the runtime validation checks:
```ts
const productsQuery = q.star
  .filterByType("product")
  .project({
    name: true,
    price: true,
    slug: "slug.current",
  });
```

Since `q` is bound to our Sanity schema, it knows the types of the product's `name`, `price`, and `slug`, so it outputs a strongly-typed result.  And since we trust our Sanity schema, we can skip the overhead of runtime checks.




## Additional Improvements

### Migrating from `grab -> project` and `grabOne-> field`

First off, Sanity's documentation uses the word "projection" to refer to grabbing specific fields, so we have renamed the `grab` method to `project` (pronounced pruh-JEKT, if that helps). It also uses the phrase "naked projection" to refer to grabbing a single field, but to keep things terse, we've renamed `grabOne` to `field`.  So we recommend migrating from `grab` to `project`, and from `grabOne` to `field`.

Regarding `grab$` and `grabOne$`, these 2 variants were needed to improve compatibility with Zod's `.optional()` utility. But the `project` and `field` methods work just fine with the built-in validation functions (like `q.string().optional()`).

The `grab`, `grabOne`, `grab$`, and `grabOne$` methods still exist, but have been deprecated, and should be replaced with the `project` and `field` methods. 

### `q.select(...)`
This is not yet supported by `groq-builder`.  

### Validation methods

Most validation methods, like `q.string()` or `q.number()`, are no longer powered by Zod, but they work just the same.  Use Zod if you want to have extra validation logic, like email validation, ranges etc.

Some validation methods, like `q.object()` and `q.array()`, are much simpler than the Zod version.  These check that the data is an `object` or an `array`, but do NOT check the shape of the data.  Use Zod to validate an object's shape, or the items inside an Array.

