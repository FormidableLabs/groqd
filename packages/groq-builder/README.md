# `groq-builder`

A **schema-aware**, strongly-typed GROQ query builder.  
It enables you to use **auto-completion** and **type-checking** for your GROQ queries. 

## Features

- **Schema-aware** - Use your `sanity.config.ts` for auto-completion and type-checking
- **Strongly-typed** - Query results are strongly typed, based on the schema
- **Optional runtime validation** - Validate or transform query results at run-time, with broad or granular levels

## Example

```ts
import { createGroqBuilder } from 'groq-builder';
import type { MySchemaConfig } from './my-schema-config';
//            ☝️ Note:
// Please see the "Schema Configuration" docs 
// for an overview of this SchemaConfig type 

const q = createGroqBuilder<MySchemaConfig>()

const productsQuery = (
  q.star
   .filterByType('products')
   .order('price desc')
   .slice(0, 10)
   .projection(q => ({
     name: true,
     price: true,
     slug: q.projection('slug.current'),
     imageUrls: q.projection('images[]').deref().projection('url')
   }))
);
```
In the above query, ALL fields are strongly-typed, according to the Sanity schema defined in `sanity.config.ts`!  

- All strings like `'products'`, `'price desc'`, and `'images[]'` are strongly-typed, based on the matching field definitions.
- In the projection, `name` and `price` are strongly-typed based on the fields of `product`.
- In the projection, sub-queries are strongly typed too.

This example generates the following GROQ query:
```groq
*[_type == "products"] | order(price desc)[0...10] {
  name,
  price,
  "slug": slug.current,
  "imageUrls": images[]->url
}
```


## Query Result Types

The above `productsQuery` example generates the following results type:

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

## Optional Runtime Validation and Custom Parsing

You can add custom runtime validation and/or parsing logic into your queries, using the `parse` method.  

The `parse` function accepts a simple function:

```ts
const products = q.star.filterByType('products').projection(q => ({
  name: true,
  price: true,
  priceFormatted: q.projection("price").parse(price => formatCurrency(price)),
}));
```

It is also compatible with [Zod](https://zod.dev/), and can take any Zod parser or validation logic:
```ts
const products = q.star.filterByType('products').projection(q => ({
  name: true,
  price: q.projection("price").parse(z.number().nonnegative()),
}));
```

## Schema Configuration

The entry-point to this library is the `createGroqBuilder<SchemaConfig>()` function, which returns a strongly-typed `q` object.  The `SchemaConfig` type parameter supplies all the document types from your Sanity Schema, enabling `q` to be schema-aware.  There are 2 ways to specify the document types: manual and generated.

### Manually typing your Sanity Schema

The simplest way to create a Sanity Schema is to manually specify the document types.  Here's a working example:

```ts
import { createGroqBuilder } from './index';

declare const references: unique symbol;
type Product = {
  _type: "product";
  _id: string;
  name: string;
  price: number;
  images: { width: number; height: number; url: string; };
  category: { _type: "reference"; _ref: string; [references]: "category"; };
}
type Category = {
  _type: "category";
  _id: string;
  name: string;
  products: Array<{ _type: "reference"; _ref: string; [references]: "product"; }>;
}

export type SchemaConfig = {
  documentTypes: Product | Category;
  referenceSymbol: typeof references;
}

export const q = createGroqBuilder<SchemaConfig>();
```

The only complexity is how **references** are handled.  In Sanity, `reference` objects don't actually say what kind of document they're referencing.  We have to add this type information, using a unique symbol.  So above, we've added  `[references]: "category"`.  This information will be used by the `.deref()` method to ensure we follow references correctly.

### Automatically generating your Sanity Schema
