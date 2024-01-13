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

Notice that the conditions are wrapped in `q.conditional$()` and then spread into the projection.  This is necessary for type-safety and runtime validation.

The `$` in the method `q.conditional$` indicates that this method is not completely type-safe; the condition statements (eg. `_type == 'movie'`) are not strongly-typed. This may be improved in a future version.

However, the most common use-case is to base conditional logic off the document's `_type`.  For this, we have the `q.conditionalByType` helper.

### Strongly-typed conditions via `q.conditionalByType(...)`

The most common use-case for conditional logic is to check the `_type` field. 
The `q.conditionalByType(...)` method makes this easier, by ensuring all conditional logic is strongly-typed, and it enables auto-complete.  For example:

```ts
const contentQuery = q.star
  .filterByType("movie", "actor")
  .project(q => ({
    slug: "slug.current",
    ...q.conditionalByType({
      movie: { title: "title", description: true },
      actor: { title: "name", biography: true },
    })
  }));
```

The result type here is inferred as: 
```ts
Array<
  | { slug: string }
  | { slug: string, title: string, description: string }
  | { slug: string, title: string, biography: string }
>
```
