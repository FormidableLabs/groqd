import type { ZodType } from "zod";

/**
 * Runs the query against the provided dataset,
 * and shows the results in the side panel.
 */
export const runQuery: <T>(
  query: { schema?: ZodType<T>; query: string },
  params?: Record<string, string | number>
) => void;
