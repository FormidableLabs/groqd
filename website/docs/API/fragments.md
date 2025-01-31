---
sidebar_position: 8
---

# Fragments

A "fragment" is a projection that's reusable.
Fragments can be used across multiple queries, and can be easily extended or combined.

> A "fragment" is just a useful `GroqD` concept; it is not an actual feature of `GROQ`.

## Creating Fragments

When creating a fragment, you first specify the type of the fragment, using either `q.fragment<T>()` or `q.fragmentForType<"...">()`. 

Then you call the `.project(...)` method to select the appropriate fields.  See the [Projections](./projections) documentation for details on this syntax.

### `q.fragmentForType<"type">()`

Creates a fragment for a Document, based on the document type.

```ts
const productFragment = q.fragmentForType<"product">().project(sub => ({
  name: q.string(),
  price: q.number(),
  images: sub.field("images[]").deref().project({
    url: q.string(),
  }),
}))
```

### `q.fragment<T>()`

Creates a fragment for any type you specify.
This is useful for inline types that do not have a top-level document type. 

```ts
const keyValueFragment = q.fragment<{ key: string, value: number }>().project({
  key: q.string(),
  value: q.number(),
})
```


## Using Fragments

Fragments are just plain objects, so they can be passed directly to `.project(frag)`, or they can be spread like `.project({ ...frag })`.

### In a Query

Pass the fragment directly to `.project`:

```ts
q.star.filterByType("product").project(productFragment)
// GROQ: *[_type == "product"]{ 
//   name, 
//   price, 
//   "images": images[]->{ url }
// } 
```

Or you can spread the fragment to extend it:

```ts
q.star.filterByType("product").project(sub => ({
  ...productFragment,
  category: sub.field("category").deref().field("title"),
}))
```


### Extending Fragments

Simply use the "spread" operator inside a projection:

```ts
const productDetailsFragment = q.fragmentForType<"product">().project(sub => ({
  ...productFragment,
  category: sub.field("category").deref().field("title"),
}))
```

### Combining Fragments

Multiple fragments can be combined using the spread operator:

```ts
const productColors = q.fragmentForType<"product">().project(sub => ({
  colors: sub.field("colors[]").deref().field("name"),
}));

const productWithColors = q.fragmentForType<"product">().project({
  ...productFragment,
  ...productColors,
})
```

### Extracting the Type

It's usually very useful to extract the type of a fragment, so you can consume it in various places.  
This can be done via `InferFragmentType<typeof frag>`:

```ts
import { InferFragmentType } from "groqd";

type ProductFragment = InferFragmentType<typeof productFragment>
// { name: string, price: number, images: Array<{ url }> }
```
