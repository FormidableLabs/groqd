# Conditionals

In Groq, there are 2 ways to use conditional logic: inline in a projection, or using the `select` function.

## Conditions in a projection

In `groq-builder`, the `project` method allows inline conditional statements with the help of `q.conditional(...)` or `q.conditionalByType(...)` using the following syntax:

```ts
const contentQuery = q.star
  .filterByType("movie", "actor")
  .project({
    slug: "slug.current",
    ...q.conditional({
      "_type == 'movie'": { title: "title", subtitle: "description" },
      "_type == 'actor'": { title: "name", subtitle: "biography" },
    }),
  });
```

This outputs the following groq query:
```groq
*[_type == "movie" || _type == "actor"] {
  "slug": slug.current,
  _type == 'movie' => {
    title,
    "subtitle": description
  },
  _type == 'actor' => {
    "title": name,
    "subtitle": biography
  }
}
```

And the result type is inferred as:
```ts
type ContentResults = InferResultType<typeof contentQuery>;
// Same as:
type ContentResults = Array<
  | { slug: string }
  | { slug: string, title: string, subtitle: string }
>;
```

Notice that the conditions are wrapped in `q.conditional()` and then spread into the projection.  This is necessary for type-safety and runtime validation.

Please note that the condition statements (eg. `_type == 'movie'`) are not strongly-typed.  For now, any string is valid, and no auto-complete is provided. This may be improved in a future version.

However, the most common use-case is to base conditional logic off the document's `_type`.  For this, we have a stronger-typed `q.conditionalByType` helper:

### Strongly-typed conditions via `q.conditionalByType(...)`

The most common use-case for conditional logic is to check the `_type` field. 
The `q.conditionalByType(...)` method makes this easier, by ensuring all conditional logic is strongly-typed, and it enables auto-complete.  For example:

```ts
const contentQuery = q.star
  .filterByType("movie", "actor")
  .project(q => ({
    slug: "slug.current",
    ...q.conditionalByType({
      movie: { title: "title", subtitle: "description" },
      actor: { title: "name", subtitle: "biography" },
    })
  }));
```

The resulting query is identical to the above example with `q.conditional`.

The result type here is inferred as:

```ts
type ContentResult = InferResultType<typeof contentQuery>;
// Same as:
type ContentResult = Array<
  { slug: string, title: string, subtitle: string }
>
```

Notice that this type is stronger than the example with `q.conditional`, because we've detected that the conditions are "exhaustive". 

## The `select` method

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

This will output the following query:
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

And will have the following result type:
```ts
type MoviesResult = InferResultType<typeof qMovies>;
// Same as:
type MoviesResult = Array<{
  name: string
  popularity: "high" | "medium" | "low"
}>
```

> Note: just like `q.conditional`, the "conditions" (eg `"popularity > 20"`) are not strongly-typed; any string is allowed.  See the `selectByType` method for a better option.  

## The `selectByType` method

You can also use the `selectByType` helper, which facilitates type-based logic.  The following example is completely strongly-typed:
```ts
const qContent = q.star.filterByType("movie", "actor").project(q => ({
  name: q.selectByType({
    movie: q => q.field("title"),
    actor: q => q.field("name"),
  })
}));
```

