import type { RootQueryConfig } from "./types/schema-types";
import { createGroqBuilder } from "./createGroqBuilder";
import { GroqBuilderOptions } from "./groq-builder";
import { zod } from "./validation/zod";

/**
 * Creates the root `q` query builder.
 *
 * Includes all Zod validation methods attached to the `q` object,
 * like `q.string()` etc. This ensures an API that's backwards compatible with GroqD syntax.
 *
 * The TRootConfig type argument is used to bind the query builder to the Sanity schema config.
 * If you specify `any`, then your schema will be loosely-typed, but the output types will still be strongly typed.
 */
export function createGroqBuilderWithZod<TRootConfig extends RootQueryConfig>(
  options: GroqBuilderOptions = {}
) {
  const q = createGroqBuilder<TRootConfig>(options);
  return Object.assign(q, zod);
}
