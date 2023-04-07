---
sidebar_position: 7
---

# FAQs

## How do I pass parameters to my groq query?

To pass params to your groq query, you can create a `runQuery` function that wraps `makeSafeQueryRunner` and passes the params as an object to the client object.

```ts
const client = sanityClient({
  /* ... */
});

const query = q("*")
  .filter("_type == 'pokemon'")
  .order("name $direction")
  .grab({
    name: q.string(),
  });

const runQuery = makeSafeQueryRunner((
  query: string,
  params: Record<string, number | string> = {}
) => client.fetch(query, params));

runQuery(query, { direction: 'asc' })

```

## Can `groqd` handle groq's `coalesce` operator?

**Yes!** You can write a coalesce expression just as if it were a field expression. Here's an example with `groqd`:

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    name: q.string(),
    // using `coalesce` in a `grab` call
    strength: ["coalesce(strength, base.Attack, 0)", q.number()],
  });
```

