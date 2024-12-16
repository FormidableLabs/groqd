import type { ZodType } from "zod";
import type { GroqBuilder } from "groq-builder";

/**
 * Runs the query against the provided dataset,
 * and shows the results in the side panel.
 */
export declare const runQuery: <T>(
  query: { schema?: ZodType<T>; query: string } | GroqBuilder<T>,
  params?: Record<string, string | number>
) => void;
