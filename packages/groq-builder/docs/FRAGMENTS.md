# Fragments

A "fragment" is a reusable projection. It is just a `groq-builder` concept, not a part of the GROQ language.

Fragments can be reused across multiple queries, and they can be easily extended or combined.

## Defining a Fragment

To create a fragment, you specify the "input type" of the fragment, then define the projection.  For example:

```ts
const productFragment = q.fragmentForType<"product">().project({
  name: q.string(),
  price: q.number(),
  slug: ["slug.current", q.string()],
});
```

You can easily extract a type from this fragment too:

```ts
type ProductFragment = InferFragmentType<typeof productFragment>;
```

## Using a Fragment

To use this fragment in a query, you can pass it directly to the `.project` method:

```ts
const productQuery = q.star.filterByType("product").project(productFragment);
```

You can also spread the fragment into a projection:
```ts
const productQuery = q.star.filterByType("product").project({
  ...productFragment,
  description: q.string(),
  images: "images[]",
});
```

## Extending and combining Fragments

Fragments are just plain objects, with extra type information.  This makes it easy to extend and combine your fragments.

To extend a fragment:

```ts
const productDetailsFragment = q.fragmentForType<"product">().project({
  ...productFragment,
  description: q.string(),
  msrp: q.number(),
  slug: q.slug("slug"),
});
```

To combine fragments:

```ts
const productDetailsFragment = q.fragmentForType<"product">().project({
  ...productFragment,
  ...productDescriptionFragment,
  ...productImagesFragment,
});
```

To infer the "result type" for any of these fragments, use `InferFragmentType`:

```ts
import { InferFragmentType } from './public-types';

type ProductFragment = InferFragmentType<typeof productFragment>;
type ProductDetailsFragment = InferFragmentType<typeof productDetailsFragment>;
type ProductDescriptionFragment = InferFragmentType<typeof productDescriptionFragment>;
type ProductImagesFragment = InferFragmentType<typeof productImagesFragment>;
```
