---
sidebar_position: 29
---

# Conditionals

GROQ supports 2 kinds of conditional statements: inline conditionals, and the `select` function.  Both have a very similar syntax.  See GROQ's [Conditional Syntax](https://www.sanity.io/docs/query-cheat-sheet#64a36d80be73) for more details.

## Inline conditionals

An inline conditional will only project certain fields when the condition is true.

### `.conditional(conditions)`

Creates an inline conditional projection:

```ts
q.star.filterByType("product").project(sub => ({
  name: q.string(),
  ...sub.conditional({
    "price == msrp": {
      onSale: q.value(false),
    },
    "price < msrp": {
      onSale: q.value(true),
      price: q.number(),
      msrp: q.number(),
    },
  }),
}))
```

<details>
<summary>Resulting GROQ and Types</summary>

```groq
*[_type == "product"]{
  name,
  price == msrp => {
    "onSale": true,
  },
  price < msrp => { 
    "onSale": false,
    price,
    msrp,
  }
}
```

```ts
type Result = Array<
  & { name: string } 
  & ({ onSale: true } | {})
  & ({ onSale: false, price: number, msrp: number } | {})
>
```
</details>

The `conditional` method takes a object map of Conditions (eg. `"price == msrp"`) to [Projections](./projections) (eg. `{ onSale: q.value(false) }`).    
You MUST spread the `conditional` result into the projection, as demonstrated above by the `...sub.conditional(...)` syntax.

The Condition strings are NOT strongly-typed.  You can put any valid GROQ statement into these keys.

When any conditional expression evaluates to `true`, those fields will be included in the projection.  Multiple expressions can be true and multiple fields will be included.

### `.conditionalByType(types)`

It is VERY common for conditions to be based on the `_type` field, so this is a strongly-typed shortcut.  Instead of writing conditions like `_type == "product"`, you simply use the `_type` as the key:

```ts
q.star.filterByType("product", "category").project(sub => ({
  name: q.string(),
  ...sub.conditionalByType({
    product: {
      price: q.number(),
    },
    category: {
      title: q.string(),
    },
  }),
}))
```

<details>
<summary>Resulting GROQ and Types</summary>

```groq
*[_type == "product" || _type == "category"]{
  name,
  _type,
  _type == "product" => {
    price,
  },
  _type == "category" => { 
    title,
  }
}
```
```ts
type Result = Array<
  & { name: string } 
  & ({ _type: "product", price: string } | {})
  & ({ _type: "category", title: string } | {})
>
```
</details>

This method offers several advantages over the `.conditional` method:

- The document types, and the projection maps, are all strongly typed
- The types are simplified if the conditions are "exhaustive"
- Better error messages are shown if the results fail validation

The Projection objects follow the same syntax as regular  [Projections](./projections).


## The `select` function

GROQ's `select` function returns the first value where the condition is true.  

### `.select(conditions, defaultValue?)`

You can add conditional logic for a single field by using the `select` method:
```ts
const qMovies = q.star.filterByType("movie").project({
  name: true,
  popularity: q.select({
    "popularity > 20": q.value("high"),
    "popularity > 10": q.value("medium"),
  }, q.value("low")),
});
```

<details>
<summary>Resulting GROQ and Types</summary>

```groq
*[_type == "movie"] {
  name,
  "popularity": select(
    popularity > 20 => "high",
    popularity > 10 => "medium",
    "low"
  )
}
```

```ts
type MoviesResults = Array<{
  name: string;
  popularity: "high" | "medium" | "low";
}>
```

</details>

> Note: just like `.conditional`, the "conditions" (eg `"popularity > 20"`) are not strongly-typed; any string is allowed.  See the `selectByType` method for a better option.


## `.selectByType(types, defaultValue?)`

You can also use the `selectByType` helper, which facilitates type-based logic.  The following example is completely strongly-typed:

```ts
const qContent = q.star.filterByType("movie", "actor").project(sub => ({
  name: sub.selectByType({
    movie: sub => sub.field("title"),
    actor: sub => sub.field("name"),
  })
}));
```

<details>
<summary>Resulting GROQ and Types</summary>

```groq
*[_type == "movie" || _type == "actor"] {
  "name": select(
    _type == "movie" => title,
    _type == "actor" => name,
  ),
}
```

```ts
type MoviesResults = Array<{
  name: string;
  popularity: "high" | "medium" | "low";
}>
```

</details>

This method offers several advantages over the `.select` method:

- The document types are all strongly typed
- The types are simplified if the conditions are "exhaustive"
- Better error messages are shown if the results fail validation
