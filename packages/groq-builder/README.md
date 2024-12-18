# `groq-builder`

A **schema-aware**, strongly-typed GROQ query builder.  
It enables you to build GROQ queries using **auto-completion**, **type-checking**, and **runtime validation**.

<details>
<summary>What is GROQ?</summary>

[GROQ is Sanity's open-source query language.](https://www.sanity.io/docs/groq)

> "It's a powerful and intuitive language that's easy to learn. With GROQ you can describe exactly what information your application needs, join information from several sets of documents, and stitch together a very specific response with only the exact fields you need."

</details>

## Features

- **Schema-aware** - uses your `sanity.config.ts` schema for auto-completion and type-checking.
- **Strongly-typed** - query results are strongly typed, based on your Sanity schema.
- **Runtime validation** - validate, parse, and transform query results at run-time, with broad or granular levels.

## Brought to you by the team behind `GroqD`

`groq-builder` is the successor to `GroqD`.  In addition to runtime validation and strongly-typed results, `groq-builder` adds schema-awareness and auto-completion.

## Example

```ts
import { createGroqBuilder } from 'groq-builder';
import type { SchemaConfig } from './schema-config';
//            ☝️ Note:
// Please see the "Schema Configuration" docs 
// for an overview of this SchemaConfig type 

const q = createGroqBuilder<SchemaConfig>()

const productsQuery = (
  q.star
   .filterByType('products')
   .order('price desc')
   .slice(0, 10)
   .project(q => ({
     name: true,
     price: true,
     slug: q.field("slug.current"),
     imageUrls: q.field("images[]").deref().field("url")
   }))
);
```
In the above query, ALL fields are strongly-typed, according to the Sanity schema defined in `sanity.config.ts`!  

- All the strings above are strongly-typed, based on field definitions, including `'products'`, `'price desc'`, `'slug.current'`, `'images[]'`, and `'url'`.
- In the projection, the keys `name` and `price` have auto-completion, and are strongly-typed, based on the fields of `product`.
- In the projection, the keys `slug` and `imageUrls` are strongly-typed based on their sub-queries.

### Example Query:

This example above generates the following GROQ query:
```groq
*[_type == "products"] | order(price desc)[0...10] {
  name,
  price,
  "slug": slug.current,
  "imageUrls": images[]->url
}
```


### Example Types:

The example above also generates the following result type:

```ts
import type { InferResultType } from 'groq-builder';

type ProductsQueryResult = InferResultType<typeof productsQuery>;
//   👆 Evaluates to the following:
type ProductsQueryResult = Array<{
  name: string,
  price: number,
  slug: string,
  imageUrls: Array<string>,
}>;
```

## Runtime Validation

`groq-builder` enables effortless runtime validation using [Zod](https://zod.dev/): 

```ts
import { z } from 'zod';

const products = q.star.filterByType('products').project(q => ({
  name: z.string(),
  slug: ["slug.current", z.string()],
  price: q.field("price", z.number().nonnegative()),
}));
```

## Custom Parsing

Validation methods can include custom validation and/or parsing logic too:

```ts
const products = q.star.filterByType('products').project(q => ({
  price: z.number(),
  priceFormatted: q.field("price", price => formatCurrency(price)),
}));
```


## Sanity Schema Configuration

To support auto-completion and maximum type-safety, you must configure `groq-builder` by providing type information for your Sanity Schema.

Fortunately, the Sanity CLI supports a `typegen` command that will generate the Sanity Schema Types for you!

### Generating Sanity Schema Types

First, in your Sanity Studio project (where you have your `sanity.config.ts`), follow [the Sanity documentation](https://www.sanity.io/docs/sanity-typegen) to run the following commands:
```sh
sanity schema extract --enforce-required-fields
sanity typegen generate
```

This generates a `sanity.types.ts` file, which contains type definitions for all your Sanity documents.

Second, copy the newly generated `sanity.types.ts` into your application (where you intend to use `groq-builder`).  


### Configuring `groq-builder` with your Sanity Schema:

In your application, you can create a strongly-typed `groq-builder` using the following snippet:

```ts
// ./q.ts
import { createGroqBuilder, ExtractDocumentTypes } from 'groq-builder';
import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";

type SchemaConfig = {
  documentTypes: ExtractDocumentTypes<AllSanitySchemaTypes>;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};
export const q = createGroqBuilder<SchemaConfig>();
```

And that's it!  Wherever you write queries, be sure to import this strongly-typed `q` and you'll get full auto-completion and type-safety! 
```ts
import { q } from './q';

const productQuery = q.star.filterByType('product');
```
