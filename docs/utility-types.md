---
sidebar_position: 6
---

# Utility Types

## `InferType`

A type utility to extract the TypeScript type for the data expected to be returned from the query.

```ts
import { q } from "groqd";
import type { InferType } from "groqd";

const query = q("*").grab({ name: q.string(), age: q.number() });
type Persons = InferType<typeof query>; // -> { name: string; age: number; }[]
```

## `TypeFromSelection`

A type utility to extract the TypeScript type for a selection, useful if extracting `.grab` selections into their own constants for re-use and you want the TypeScript type that will come with it. Also useful if you're using conditional selections with `.grab` and want to split out each conditional selection into its own `const` and get the expected type from that.

```ts
import { q } from "groqd";
import type { TypeFromSelection, Selection } from "groqd";

// TextBlock.tsx
const TextBlock = (props: TypeFromSelection<typeof textBlockSelection>) => { /* ... */ };

export const textBlockSelection = {
  _type: q.literal("textBlock"),
  text: q.string(),
} satisfies Selection;

// somewhere else
import { q } from "groqd";
import { textBlockSelection } from "./TextBlock";

const { schema } = q("*")
  .filter("_type == 'blockPage'")
  .grab({
    content: q("content").grab({}, {
      // 👇 using `textBlockSelection` in a conditional selection
      "_type == 'blockText'": textBlockSelection,
    })
  });
```
