---
sidebar_position: 20
---


# Filters

## `.star`

Selects all documents, via GROQ's `*` selector.
This is how most queries start.

```ts
q.star.filterByType(...).project(...)
```

## `.filterByType(type)`

Filters the query based on the document type.  
Supports multiple type arguments.

```ts
q.star.filterByType("pokemon");
// Result GROQ: *[_type == "pokemon"]
// Result Type: Pokemon[]
```

## `.filterBy(expression)`

Filters the query based on a GROQ expression.  
The `expression` is a strongly-typed string, but only supports simple equality expressions.

```ts
q.star
 .filterByType("product")
 .filterBy('category == "shoe"')
```

> For more complex expressions, use `.filterRaw(expression)`:


## `.filterRaw(expression)`

Filters the query based on **any** GROQ expression.

> ⚠️ This method allows any GROQ `string`, and the syntax is not checked.  Please use `.filterBy` for strongly-typed expressions.

```ts
q.star
 .filterByType("product")
 .filterRaw("price >= 50");
// Result GROQ: *[_type == "product"][price >= 50]
// Result Type: Product[]
```

## `.order(field)`

Orders the results using a strongly-typed expression, such as `"name asc"` or `"slug.current desc"`.  Supports multiple sort expressions.

```ts
q.star
 .filterByType("product")
 .order("price asc", "slug.current desc")
// Result GROQ: *[_type == "product"] | order(price asc, slug.current desc)
// Result Type: Product[]
```

## `.slice(index)`

Returns a single item from the results, based on the index.

```ts
q.star
 .filterByType("product")
 .slice(0)
// Result GROQ: *[_type == "product"][0]
// Result Type: Product
```

## `.slice(start, end, inclusive = false)`

Returns a range of items from the results.  
If `inclusive` is set, the `end` item will be included.

```ts
q.star
 .filterByType("product")
 .slice(10, 20)
// Result GROQ: *[_type == "product"][10...20]
// Result Type: Product[]
```
