---
sidebar_position: 7
---

# FAQs

## How do I pass parameters to my groq query?

TODO:

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

