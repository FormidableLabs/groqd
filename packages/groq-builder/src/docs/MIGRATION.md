# Migration from version 0.x

## Backwards compatible mode:


### Simple example

#### Before
```ts
import { q } from "groqd";

const productQuery = q("*")
  .filterByType("product")
  .grab({
    name: q.string(),
    price: q.number(),
    slug: ["slug.current", q.string().optional()]
  });
```

#### After
```ts
import { q } from "groq-builder/compat";

const productQuery = q.star
  .filterByType("product")
  .grab({
    name: q.string(),
    price: q.number(),
    slug: ["slug.current", q.string().optional()],
  });
```

Note the 2 changes:
1. Import from `groq-builder/compat`
2. Change `q("*")` to `q.star`

Also note that in "compat" mode, queries are schema-unaware.  
The output types are determined by the validation functions, like `q.string().optional()`. 


### Upgrading to use a strongly-typed schema 
```ts
import { createGroqBuilder } from "groq-builder";
import { MySanityConfig } from "./my-sanity-config";
const q = createGroqBuilder<MySanityConfig>();

const productQuery = q.star
  .filterByType("product")
  .projection({
    name: true,
    price: true,
    slug: "slug.current",
  });
```
Note the following changes:
1. `grab` was renamed to `projection`
2. We do not need to explicitly specify the types for `name`, `price`, or `slug.current`; these are all inferred from the Sanity Schema.

The output type is exactly
