---
sidebar_position: 1
slug: /
---


# Introduction

[![GROQD](https://oss.nearform.com/api/banner?badge=groqd&bg=c99f46)](https://commerce.nearform.com/open-source/groqd)


`groqd` is a **schema-aware**, strongly-typed GROQ query builder.  
It enables you to write GROQ queries using **auto-completion**, **type-checking**, and **runtime validation**.

The goal of `groqd` is to give you the _flexibility_ of GROQ, the [runtime safety of Zod](https://github.com/colinhacks/zod), and the best TypeScript developer experience possible. 

<details>
<summary>What is GROQ?</summary>

[GROQ is Sanity's open-source query language.](https://www.sanity.io/docs/groq)

> "It's a powerful and intuitive language that's easy to learn. With GROQ you can describe exactly what information your application needs, join information from several sets of documents, and stitch together a very specific response with only the exact fields you need."

</details>

## Usage Example
`GROQD` uses a chaining syntax to build queries:

```ts
import { q } from "./groqd-client";

const productsQuery = (
  q.star
   .filterByType("products")
   .order("price desc")
   .slice(0, 10)
   .project(product => ({
     name: q.string(),
     price: q.number(),
     slug: product.field("slug.current", q.string()),
     imageUrls: product.field("images[]").deref().field("url", q.string())
   }))
);
```

Everything in the above query is strongly-typed, according to the Sanity schema defined in your `sanity.config.ts`.  This even includes all strings (like `"price desc"`).

### Results

The example above results in a GROQ query like this:

```groq
*[_type == "products"] | order(price desc) [0...10] {
  name,
  price,
  "slug": slug.current,
  "imageUrls": images[]->url
}
```

and executing the query will return strongly-typed results:

```ts
const results = await runQuery(productsQuery);
/*
 * results: Array<{ 
 *   name: string,
 *   price: number,
 *   slug: string,
 *   imageUrls: Array<string>,
 * }>
 */
```


## Why `GROQD` over raw `GROQ`?

Sanity's CLI can generate types from your raw `GROQ` queries. This works well for simple use-cases.  
However, `GROQD` aims to maximize the developer experience, improve generated types, and ensure scalability. Namely, it adds:

- **Auto-completion** - write queries quickly and confidently
- **Runtime validation** - ensure data integrity, catch errors early
- **Transformation** - map values at runtime, like parsing dates
- **Fragments** - create reusable query fragments, and compose queries from other fragments


## The Playground

We also provide a [Vision](https://www.sanity.io/docs/the-vision-plugin)-like Sanity Studio tool for experimenting with `groqd` queries and running them against your actual dataset.

![Screenshot of groqd playground in action](./img/groqd-playground-sample.png)

The playground is a drop-in Sanity plugin, and is an easy way to test out `groqd` within your dataset. See [the playground docs](./groqd-playground.mdx) for more information on the playground.
