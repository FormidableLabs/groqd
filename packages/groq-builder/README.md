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
     slug: q.projection('slug').projection('current'),
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
import type { QueryResultType } from 'groq-builder';

type ProductsQueryResult = QueryResultType<typeof productsQuery>;
// Evaluates to:
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
