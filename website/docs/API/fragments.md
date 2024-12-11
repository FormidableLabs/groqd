---
sidebar_position: 28
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
    width: q.number(),
    height: q.number(),
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

### In a Query

### Extending Fragments

### Combining Fragments

### Extracting the Type
