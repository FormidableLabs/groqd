---
sidebar_position: 2
---

# Configuration

In your project, create a GroqBuilder instance, conventionally named `q`:

```ts
// ./groqd-client.ts
import { createClient } from "@sanity/client";
import { createGroqBuilderWithZod, ExtractDocumentTypes, makeSafeQueryRunner } from 'groq-builder';

import { AllSanitySchemaTypes, internalGroqTypeReferenceTo } from "./sanity.types.ts";

const sanityClient = createClient({ /* your sanity config goes here */ });

// 👇 Create a type-safe query runner
export const runQuery = makeSafeQueryRunner((query) => sanityClient.fetch(query));

// 👇 Create a type-safe query builder
export const q = createGroqBuilderWithZod<{
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
}>({});
```

<details>
<summary>
What if I don't want to use a strongly-typed schema?
</summary>

A strongly-typed schema is used to enhance type-checking, enables auto-complete, and makes runtime validation optional.

If you don't want to, or can't, provide a schema, you can use `any` instead. You'll still get strongly-typed results!  
We highly recommend using the `validationRequired: true` option for this scenario.

```ts
import { createGroqBuilderWithZod } from 'groq-builder';
export const q = createGroqBuilderWithZod<any>({
  validationRequired: true
});
```

</details>
