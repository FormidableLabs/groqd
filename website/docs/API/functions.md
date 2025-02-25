---
sidebar_position: 55
---

# Functions

The GROQ language has many functions.

GroqD supports several of these in a strongly-typed way.

## `.count(expression)`

Calls the `count` function, to count the number of items in an expression.

It can be called in a projection, like:
```ts
const products = q.star.filterByType("product").project(sub => ({
  imagesCount: sub.count("images[]")
}))
```

You can pass a simple projection string like above, 
or you can pass a more complex query, like:
```ts
const products = q.star.filterByType("product").project(sub => ({
  imagesCount: sub.count(sub.field("images[]").filterBy("asset != null"))
}))
```

This can also be called at the root level, like:
```ts
const productCountQuery = q.count(q.star.filterByType("product"));
```

## `.coalesce(...expressions)`

Calls the `coalesce` function, which returns the first non-null value.

This can be called in a subquery, like:
```ts
const productsQuery = q.star.filterByType("product").project(sub => ({
  title: sub.coalesce("title", "metadata.title", "category.title", q.value("DEFAULT"))
}))
```

You can pass any mix of simple projection strings, and complex queries:
```ts
const productsQuery = q.star.filterByType("product").project(sub => ({
  title: sub.coalesce(
    "title", 
    "metadata.title", 
    sub.field("categories[]").slice(0).deref().field("title"), 
    q.value("DEFAULT")
  )
}))
```

This can also be called at the root level, like:
```ts
const x = q.coalesce(
  q.star.filterByType("product").filterBy("slug.current === $slug").slice(0),
  q.star.filterByType("variant").filterBy("slug.current === $slug").slice(0),
  q.star.filterByType("category").filterBy("slug.current === $slug").slice(0),
)
```

## `.raw(expression, validation?)`

The `.raw` function is an "escape hatch" for any query that's not yet supported by GroqD.

This can be very useful for GROQ functions, like `array::compact()` or `geo::distance()`.

You must either specify the type via `.raw<T>(expression)`, 
or provide a type validation parameter via `.raw(expression, validation)`.

```ts
q.star.filterByType("storefront").project(sub => ({
  distance: sub.raw("geo::distance(geoPoint, $currentLocation)", z.number()),
  isInDeliveryZone: sub.raw<boolean>("geo::contains(deliveryZone, $currentLocation)")
}))
```
