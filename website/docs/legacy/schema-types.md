---
sidebar_position: 54
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

Corresponds to [Zod's string type](https://github.com/colinhacks/zod#strings).

## `q.number`

Corresponds to [Zod's number type](https://github.com/colinhacks/zod#numbers).

## `q.boolean`

Corresponds to [Zod's boolean type](https://github.com/colinhacks/zod#booleans).

## `q.literal`

Corresponds to [Zod's literal type](https://github.com/colinhacks/zod#literals).

## `q.union`

Corresponds to [Zod's union type](https://github.com/colinhacks/zod#unions).

## `q.date`

A custom Zod schema that can accept `Date` instances _or_ a date string (and it will transform that date string to a `Date` instance). 

:::caution
Date objects are not serializable, so you might end up with a data object that can't be immediately serialized – potentially a problem if using `groqd` in e.g. a Next.js backend data fetch.
:::

## `q.null`

Corresponds to Zod's null type.

## `q.undefined`

Corresponds to Zod's undefined type.

## `q.array`

Corresponds to [Zod's array type](https://github.com/colinhacks/zod#arrays).

## `q.object`

Corresponds to [Zod's object type](https://github.com/colinhacks/zod#objects).

## `q.slug`

A convenience schema to easily grab a slug. Takes a single argument, which is the name of the slug field.

```ts
q("*")
  .filterByType("blogPost")
  .grab({
    //     👇 slug schema
    slug: q.slug("slug"),
    // equivalent to...
    slug: ["slug.current", q.string()]
  });
```

## `q.contentBlock`

A custom Zod schema to match Sanity's `block` type, helpful for fetching data from a field that uses Sanity's block editor. For example:

```ts
q("*")
  .filter("_type == 'user'")
  .grab({ body: q.array(q.contentBlock()) });
```

Pass an object of the shape `{ markDefs: z.ZodType }` to `q.contentBlock` to specify custom markdef types, useful if you have custom markdefs, e.g.:

```ts
q("*")
  .filter("_type == 'user'")
  .grab({
    body: q.array(q.contentBlock({
      markDefs: q.object({ _type: q.literal("link"), href: q.string() })
    }))
  });
```

## `q.contentBlocks`

`q.contentBlocks`, a custom Zod schema, to match a list of `q.contentBlock`'s. Pass an argument of the shape `{ markDefs: z.ZodType }` to specify custom markdef types.
  
```ts
q("*")
  .filter("_type == 'user'")
  .grab({ body: q.contentBlocks() });
```
