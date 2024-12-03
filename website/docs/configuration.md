---
sidebar_position: 3
---

# Configuration

## Configure the GroqBuilder

In your project, create a file called `groqd-client.ts`:

```ts
import { createClient } from "@sanity/client";
import { createGroqBuilderWithZod, makeSafeQueryRunner } from 'groq-builder';

// Import the Sanity Schema types from this generated file:
import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";

const sanityClient = createClient({ 
  /* ✨ your sanity config goes here */
});

// 👇 Create a type-safe query runner
export const runQuery = makeSafeQueryRunner((query) => sanityClient.fetch(query));

// 👇 Create a type-safe query builder
type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};
export const q = createGroqBuilderWithZod<SchemaConfig>({});
```

## Generating the types from your Sanity Schema

The above example imports the Sanity Schema types from a generated `sanity.types.ts` file.  

To generate this file from your Sanity Schema, you'll need to use Sanity's TypeGen tool: https://www.sanity.io/docs/sanity-typegen

The workflow looks like this:
- From your Sanity project, you use the `sanity` CLI to generate the `sanity.types.ts` file
- You then copy that file from the Sanity project into your project


## Do I have to use a strongly-typed schema?

A strongly-typed schema enhances type-checking, enables auto-complete, and makes runtime validation optional.

If you don't want to, or can't, provide a schema, you can use `any` instead. You'll still get strongly-typed results!  
We highly recommend using the `validationRequired: true` option for this scenario, which forces runtime type checks.

```ts
export const q = createGroqBuilderWithZod<any>({ validationRequired: true });
```
