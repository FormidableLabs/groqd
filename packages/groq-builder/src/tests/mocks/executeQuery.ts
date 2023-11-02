import { RootConfig } from "../../utils/schema-types";
import { GroqBuilder } from "../../groq-builder";
import * as groqJs from "groq-js/src/1";

type Dataset = Array<object>;

export async function executeBuilder<TScope, TRootConfig extends RootConfig>(
  dataset: Dataset,
  buider: GroqBuilder<TScope, TRootConfig>,
  params = {}
): Promise<TScope> {
  const query = buider.query;
  const result = await executeQuery(dataset, query, params);
  return result as TScope;
}

export async function executeQuery(
  dataset: Dataset,
  query: string,
  params: Record<string, string>
): Promise<unknown> {
  const parsed = groqJs.parse(query, { params });
  const streamResult = await groqJs.evaluate(parsed, { dataset, params });
  const start = Date.now();
  const result = await streamResult.get();

  const INEFFICIENT_QUERY_THRESHOLD = 5_000;
  const elapsed = Date.now() - start;
  if (elapsed >= INEFFICIENT_QUERY_THRESHOLD) {
    // Issue a warning!
    console.warn(`
      [groq-handler] WARNING: this query took ${elapsed} ms to mock execute.
      This usually indicates an inefficient query, and you should consider improving it.
      ${
        query.includes("&&")
          ? "Instead of using [a && b], consider using [a][b] instead!"
          : ""
      }
      Inefficient query: \n${query}
    `);
  }
  return result;
}
