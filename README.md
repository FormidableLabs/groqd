[![GROQD — Formidable, We build the modern web](https://raw.githubusercontent.com/FormidableLabs/groqd/main/groqd-Hero.png)](https://formidable.com/open-source/)

`groqd` is a schema-unaware, runtime-safe query builder for [GROQ](https://www.sanity.io/docs/groq). **The goal of `groqd` is to give you (most of) the flexibility of GROQ, with the runtime/type safety of [Zod](https://github.com/colinhacks/zod) and TypeScript.**

`groqd` works by accepting a series of GROQ operations, and generating a query to be used by GROQ and a Zod schema to be used for parsing the associated GROQ response.

An illustrative example:

```ts
import { q } from "groqd";

// Get all of the Pokemon types, and the Pokemon associated to each type.
const { query, schema } = q("*")
  .filter("_type == 'poketype'")
  .grab({
    name: q.string(),
    pokemons: q("*")
      .filter("_type == 'pokemon' && references(^._id)")
      .grab({ name: q.string() }),
  });

// Use the schema and the query as you see fit, for example:
const response = schema.parse(await sanityClient.fetch(query));

// At this point, response has a type of:
// { name: string, pokemons: { name: string }[] }[]
// 👆👆
```

Since the primary use-case for `groqd` is actually executing GROQ queries and validating the response, we ship a utility to help you make your own fetching function. Here's an example of wrapping `@sanity/client`'s fetch function:

```ts
import sanityClient from "@sanity/client";
import { q, makeSafeQueryRunner } from "groqd";

const client = sanityClient({
  /* ... */
});
// 👇 Safe query runner
export const runQuery = makeSafeQueryRunner((query) => client.fetch(query));

// ...

// 👇 Now you can run queries and `data` is strongly-typed, and runtime-validated.
const data = await runQuery(
  q("*").filter("_type == 'pokemon'").grab({ name: q.string() }).slice(0, 150)
);
// data: { name: string }[]
```

Using `makeSafeQueryRunner` is totally optional; you might find using `q().schema` and `q().query` in your own abstractions works better for you.

## **NOTE**: Significant API changes with 0.3.0

Prior to version 0.3.0, `groqd` provided a pipeline API. However, there were some major drawbacks to that API. We've migrated to a builder pattern API that looks _similar_ to the previous API, but using a builder pattern (instead of piping).

The core difference is instead of feeding all arguments to `q()`, `q()` accepts a single argument and then you chain method calls on that. For example:

```ts
// previously...
q("*", q.filter("_type == 'pokemon'"), q.grab({ name: q.string() }));

// NOW!
q("*").filter("_type == 'pokemon'").grab({ name: q.string() });
```

These API changes allow us to provide a substantially better TS experience for the end user, and makes the library much easier to maintain and contribute to.

## Why `groqd`? 🤷‍

GROQ's primary use is with [Sanity](https://www.sanity.io/). Sanity's Content Lake is fundamentally unstructured, and GROQ (and Sanity's GROQ API) do not have any sort of GraqhQL-like type contracts.

We'd love to see advanced codegen for Sanity and GROQ. However, the end-result would likely not be as runtime type-safe as some might desire due to the flexibility of Sanity's Content Lake and the GROQ language in general.

The goal of `groqd` is to work around these constraints by allowing _you_ to specify the runtime data schema for your query so that your data's type is _runtime safe_ – not just theoretically, but empirically.

## API:

`groqd` uses a builder pattern for building queries. Builder instances are created with a function `q`, and are chainable. There are four internal classes that are used as part of the query builder process: `UnknownQuery`, `ArrayQuery`, `UnknownArrayQuery`, and `EntityQuery`. These four classes have _some_ overlap, but generally only contain methods that "make sense" for the type of result they represent (e.g. `ArrayQuery` will contain methods that an `EntityQuery` will not, such as filtering and ordering).

### `q`

The entry point for the query builder, which takes a base query as its sole argument (such as `"*"`). Returns an `UnknownResult` instance to be built upon.

```ts
const { query, schema } = q("*").filter("_type == 'pokemon'");
```

This function is best used in conjunction with a "query runner" from [`makeSafeQueryRunner`](#makesafequeryrunner), such as:

```ts
import sanityClient from "@sanity/client";
import { q, makeSafeQueryRunner } from "groqd";

// Wrap sanityClient.fetch
const client = sanityClient({
  /* ... */
});
export const runQuery = makeSafeQueryRunner((query) => client.fetch(query));

// Now you can fetch your query's result, and validate the response, all in one.
const data = await runQuery(q("*").filter("_type == 'pokemon'"));
```

### `.grab`

Available on `UnknownQuery`, `ArrayQuery`, and `EntityQuery`, handles [projections](https://www.sanity.io/docs/how-queries-work#727ecb6f5e15), or selecting fields from an existing set of documents. This is the primary mechanism for providing a schema for the data you expect to get.

`q.grab` accepts a "selection" object as its sole argument, with three different forms:

```ts
q("*").grab({
  // projection is `{ "name": name }`, and validates that `name` is a string.
  name: ["name", q.string()],

  // shorthand for `description: ['description', q.string()]`,
  //  projection is just `{ description }`
  description: q.string(),

  // can also pass a sub-query for the field,
  //  projection is `{ "types": types[]->{ name } }`
  types: q("types").filter().deref().grab({ name: q.string() }),
});
```

See [Schema Types](#schema-types) for available schema options, such as `q.string()`. These generally correspond to Zod primitives, so you can do something like:

```ts
q("*").grab({
  name: q.string().optional().default("no name"),
});
```

#### Conditional selections with `.grab`

Groq offers a `select` operator that you can use at the field-level to conditionally select values, such as the following.

```ts
q("*").grab({
  strength: [
    "select(base.Attack > 60 => 'strong', base.Attack <= 60 => 'weak')",
    q.union([q.literal("weak"), q.literal("strong")]),
  ],
});
```

However, in real-world practice it's common to have an array of values of varying types and you want to select different values for each type. `.grab` allows you to do conditional selections by providing a second argument of the shape `{[condition: string]: Selection}`.

This second argument is not as flexible as the `=>` operator or `select` function in GROQ, and instead provides a way to "fork" a portion of your selection (e.g., only the base selection and _one_ of the conditional selections will be made at any give time). Here's an example.

```ts
q("*")
  // Grab _id on all pokemon
  .grab(
    {
      _id: q.string(),
    },
    {
      // And for Bulbasaur, grab the HP
      "name == 'Bulbasaur'": {
        name: q.literal("Bulbasaur"),
        hp: ["base.HP", q.number()],
      },
      // And for Charmander, grab the Attack
      "name == 'Charmander'": {
        name: q.literal("Charmander"),
        attack: ["base.Attack", q.number()],
      },
    }
  );

// The query result type looks something like this:
type QueryResult = (
  | { _id: string; name: "Bulbasaur"; hp: number }
  | { _id: string; name: "Charmander"; attack: number }
  | { _id: string }
)[];
```

In real-world Sanity use-cases, it's likely you'll want to "fork" based on a `_type` field (or something similar).

**Important!** In the example above, if you were to add `name: q.string()` to the base selection, it would break TypeScript's ability to do discriminated union type narrowing. This is because if you have a type like `{name: "Charmander"} | {name: string}` there is no way to narrow types based on the `name` field (since for discriminated unions to work, the field must have a _literal_ type).

### `.grab$`

Just like `.grab`, but uses the `nullToUndefined` helper [outlined below](#nulltoundefined) to convert `null` values to `undefined` which makes writing queries with "optional" values a bit easier.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab$({
    name: q.string(),
    // 👇 `foo` comes in as `null`, but gets preprocessed to `undefined` so we can use `.optional()`.
    foo: q.string().optional().default("bar"),
  })
```

### `.grabOne`

Similar to `q.grab`, but for ["naked" projections](https://www.sanity.io/docs/how-queries-work#dd66cae5ed8f) where you just need a single property (instead of an object of properties). Pass a property to be "grabbed", and a schema for the expected type.

```ts
q("*").filter("_type == 'pokemon'").grabOne("name", q.string());
// -> string[]
```

### `.grabOne$`

Just like `.grabOne`, but uses the `nullToUndefined` helper [outlined below](#nulltoundefined) to convert `null` values to `undefined` which makes writing queries with "optional" values a bit easier.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grabOne$("name", q.string().optional());
```

### `.filter`

Receives a single string argument for the GROQ filter to be applied (without the surrounding `[` and `]`). Applies the GROQ filter to the query and adjusts schema accordingly.

```ts
q("*").filter("_type == 'pokemon'");
// translates to: *[_type == 'pokemon']
```

### `.order`

Receives a list of ordering expression, such as `"name asc"`, and adds an order statement to the GROQ query.

```ts
q("*").filter("_type == 'pokemon'").order("name asc");
// translates to *[_type == 'pokemon']|order(name asc)
```

### `.slice`

Creates a slice operation by taking a minimum index and an optional maximum index.

```ts
q("*").filter("_type == 'pokemon'").grab({ name: q.string() }).slice(0, 8);
// translates to *[_type == 'pokemon']{name}[0..8]
// -> { name: string }[]
```

The second argument can be omitted to grab a single document, and the schema/types are updated accordingly.

```ts
q("*").filter("_type == 'pokemon'").grab({ name: q.string() }).slice(0);
// -> { name: string }
```

### `.deref`

Used to apply the de-referencing operator `->`.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    name: q.string(),
    // example of grabbing types for a pokemon, and de-referencing to get name value.
    types: q("types").filter().deref().grabOne("name", q.string()),
  });
```

### `.score`

Used to pipe a list of results through the `score` GROQ function.

```ts
// Fetch first 9 Pokemon's names, bubble Char* (Charmander, etc) to the top.
q("*")
  .filter("_type == 'pokemon'")
  .slice(0, 8)
  .score(`name match "char*"`)
  .order("_score desc")
  .grabOne("name", z.string());
```

### `.nullable`

A method on the base query class that allows you to mark a query's schema as nullable – in case you are expecting a potential null value.

```ts
q("*")
  .filter("_type == 'digimon'")
  .slice(0)
  .grab({ name: q.string() })
  .nullable(); // 👈 we're okay with a null value here
```

### Schema Types

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

- `q.string`, corresponds to [Zod's string type](https://github.com/colinhacks/zod#strings).
- `q.number`, corresponds to [Zod's number type](https://github.com/colinhacks/zod#numbers).
- `q.boolean`, corresponds to [Zod's boolean type](https://github.com/colinhacks/zod#booleans).
- `q.literal`, corresponds to [Zod's literal type](https://github.com/colinhacks/zod#literals).
- `q.union`, corresponds to [Zod's union type](https://github.com/colinhacks/zod#unions).
- `q.date`, which is a custom Zod schema that can accept `Date` instances _or_ a date string (and it will transform that date string to a `Date` instance). **Warning**: Date objects are not serializable, so you might end up with a data object that can't be immediately serialized – potentially a problem if using `groqd` in e.g. a Next.js backend data fetch.
- `q.null`, corresponds to Zod's null type.
- `q.undefined`, corresponds to Zod's undefined type.
- `q.array`, corresponds to [Zod's array type](https://github.com/colinhacks/zod#arrays).
- `q.object`, corresponds to [Zod's object type](https://github.com/colinhacks/zod#objects).
- `q.contentBlock`, a custom Zod schema to match Sanity's `block` type, helpful for fetching data from a field that uses Sanity's block editor. For example:
  ```ts
  q("*")
    .filter("_type == 'user'")
    .grab({ body: q.array(q.contentBlock()) });
  ```
- `q.contentBlocks`, a custom Zod schema, to match a list of `q.contentBlock`'s. 
  ```ts
  q("*")
    .filter("_type == 'user'")
    .grab({ body: q.contentBlocks() });
  ```

### `nullToUndefined`

GROQ will return `null` if you query for a value that does not exist. This can lead to confusion when writing queries, because Zod's `.optional().default("default value")` doesn't work with null values. `groqd` ships with a `nullToUndefined` method that will preprocess `null` values into `undefined` to smooth over this rough edge.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    name: q.string(),
    // 👇 Missing field, allow us to set a default value when it doesn't exist
    foo: nullToUndefined(q.string().optional().default("bar")),
  })
```

The `nullToUndefined` helper can also accept a `Selection` object to apply to an entire selection.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab(nullToUndefined({
    name: q.string(),
    foo: q.string().optional().default("bar"),
  }))
```

Although we recommend just using `.grab$` in this case.

### `q.sanityImage`

A convenience method to make it easier to generate image queries for Sanity's image type. Supports fetching various info from both `image` documents and `asset` documents.

In its simplest form, it looks something like this:

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    cover: q.sanityImage("cover"), // 👈 just pass the field name
  });

// -> { cover: { _key: string; _type: string; asset: { _type: "reference"; _ref: string; } } }[]
```

which will allow you to fetch the minimal/basic image document information.

#### `q.sanityImage`'s `isList` option

If you have an array of image documents, you can pass `isList: true` to an options object as the second argument to `q.sanityImage` method.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    images: q.sanityImage("images", { isList: true }), // 👈 fetch as a list
  });

// -> { images: { ... }[] }[]
```

#### `q.sanityImage`'s `withCrop` option

Sanity's image document has fields for crop information, which you can query for with the `withCrop` option.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    cover: q.sanityImage("cover", { withCrop: true }), // 👈 fetch crop info
  });

// -> { cover: { ..., crop: { top: number; bottom: number; left: number; right: number; } | null } }[]
```

#### `q.sanityImage`'s `withHotspot` option

Sanity's image document has fields for hotspot information, which you can query for with the `withHotspot` option.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    cover: q.sanityImage("cover", { withHotpot: true }), // 👈 fetch hotspot info
  });

// -> { cover: { ..., hotspot: { x: number; y: number; height: number; width: number; } | null } }[]
```

#### `q.sanityImage`'s `additionalFields` option

Sanity allows you to add additional fields to their image documents, such as alt text or descriptions. The `additionalFields` option allows you to specify such fields to query with your image query.

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    cover: q.sanityImage("cover", {
      // 👇 fetch additional fields
      additionalFields: {
        alt: q.string(),
        description: q.string(),
      },
    }),
  });

// -> { cover: { ..., alt: string, description: string } }[]
```

#### `q.sanityImage`'s `withAsset` option

Sanity's image documents have a reference to an asset document that contains a whole host of information relative to the uploaded image asset itself. The `q.sanityImage` will allow you to dereference this asset document and query various fields from it.

You can pass an array to the `withAsset` option to specify which fields you want to query from the asset document:

- pass `"base"` to query the base asset document fields, including `extension`, `mimeType`, `originalFilename`, `size`, `url`, and `path`.
- pass `"dimensions"` to query the asset document's `metadata.dimensions` field, useful if you need the image's original dimensions or aspect ratio.
- pass `"location"` to query the asset document's `metadata.location` field.
- pass `"lqip"` to query the asset's `metadata.lqip` (Low Quality Image Placeholder) field, useful if you need to display LQIPs.
- pass `"palette"` to query the asset document's `metadata.palette` field, useful if you want to use the image's color palette in your UI.

An example:

```ts
q("*")
  .filter("_type == 'pokemon'")
  .grab({
    cover: q.sanityImage("cover", {
      withAsset: ["base", "dimensions"],
    }),
  });

// -> { cover: { ..., asset: { extension: string; mimeType: string; ...; metadata: { dimensions: { aspectRatio: number; height: number; width: number; }; }; }; } }[]
```

### `makeSafeQueryRunner`

A wrapper around `q` so you can easily use `groqd` with an actual fetch implementation.

Pass `makeSafeQueryRunner` a "query executor" of the shape `type QueryExecutor = (query: string, ...rest: any[]) => Promise<any>`, and it will return a "query runner" function. This is best illustrated with an example:

```ts
import sanityClient from "@sanity/client";
import { q } from "groqd";

// Wrap sanityClient.fetch
const client = sanityClient({
  /* ... */
});
export const runQuery = makeSafeQueryRunner((query) => client.fetch(query));

// 👇 Now you can run queries and `data` is strongly-typed, and runtime-validated.
const data = await runQuery(
  q("*").filter("_type == 'pokemon'").grab({ name: q.string() }).slice(0, 150)
);
```

In Sanity workflows, you might also want to pass e.g. params to your `client.fetch` call. To support this, add additional arguments to your `makeSafeQueryRunner` argument's arguments as below.

```ts
// ...
export const runQuery = makeSafeQueryRunner(
  //      👇 add a second arg
  (query, params: Record<string, unknown> = {}) => client.fetch(query, params)
);

const data = await runQuery(
  q("*").filter("_type == 'pokemon' && _id == $id").grab({ name: q.string() }),
  { id: "pokemon.1" } // 👈 and optionally pass them here.
);
```

### `InferType`

A type utility to extract the TypeScript type for the data expected to be returned from the query.

```ts
import { q } from "groqd";
import type { InferType } from "groqd";

const query = q("*").grab({ name: q.string(), age: q.number() });
type Persons = InferType<typeof query>; // -> { name: string; age: number; }[]
```

### `TypeFromSelection`

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

## FAQs

### Can `groqd` handle groq's `coalesce` operator?

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
