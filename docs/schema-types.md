---
sidebar_position: 4
---

# Schema Types

The `.grab` and `.grabOne` methods are used to "project" and select certain values from documents, and these are the methods that dictate the shape of the resulting schema/data. To indicate what type specific fields should be, we use schemas provided by the `groqd` library, such as `q.string`, `q.number`, `q.boolean`, and so on.

For example:

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    // string field
    name: q.string(),

    // number field
    hp: ["base.HP", q.number()],

    // boolean field
    isStrong: ["base.Attack > 50", q.boolean()],
  });
```

The available schema types are shown below.

## `q.string`

TODO:

## `q.number`

TODO:

## `q.boolean`

TODO:

## `q.literal`

TODO:

## `q.union`

TODO:

## `q.date`

TODO:

## `q.null`

TODO:

## `q.undefined`

TODO:

## `q.array`

TODO:

## `q.object`

TODO:

## `q.contentBlock`

TODO:

## `q.contentBlocks`

TODO:
