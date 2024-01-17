# Conditionals

In Groq, there are 2 ways to use conditional logic: inline in a projection, or using the `select` function.

## Conditions in a projection

In `groq-builder`, the `project` method allows inline conditional statements with the help of `q.conditional$(...)` or `q.conditionalByType(...)` using the following syntax:

```ts
const contentQuery = q.star
  .filterByType("movie", "actor")
  .project({
    slug: "slug.current",
    ...q.conditional$({
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
type ContentResults = 
  | { slug: string }
  | { slug: string, title: string, subtitle: string }
;
```

Notice that the conditions are wrapped in `q.conditional$()` and then spread into the projection.  This is necessary for type-safety and runtime validation.

The `$` in the method `q.conditional$` indicates that this method is not completely type-safe; the condition statements (eg. `_type == 'movie'`) are not strongly-typed (this may be improved in a future version).

However, the most common use-case is to base conditional logic off the document's `_type`.  For this, we have the `q.conditionalByType` helper:

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

The resulting query is identical to the above example with `q.conditional$`.

The result type here is inferred as: 
```ts
Array<
  { slug: string, title: string, subtitle: string }
>
```

Notice that this type is stronger than the example with `q.conditional$`, because we've detected that the conditions are "exhaustive". 

## The `select` method

Adds support for the `select$` method:
```ts
const qMovies = q.star.filterByType("movie").project({
  name: true,
  popularity: q.select$({
    "popularity > 20": q.value("high"),
    "popularity > 10": q.value("medium"),
  }, q.value("low")),
});
```

The `$` sign is to indicate that there's some "loosely typed" code in here -- the conditions are unchecked.

## The `selectByType` method

Adds a `selectByType` helper, which facilitates type-based logic.  This is completely strongly-typed:
```ts
const qContent = q.star.filterByType("movie", "actor").project(q => ({
  name: q.selectByType({
    movie: q => q.field("title"),
    actor: q => q.field("name"),
  })
}));
```

