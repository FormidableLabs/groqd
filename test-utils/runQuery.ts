import { QueryResult } from "../src";
import { z } from "zod";
import { evaluate, parse } from "groq-js";
import { pokemonDataset } from "./pokemon";

const makeQueryRunner =
  (dataset: any[]) =>
  async <T extends z.ZodType>(
    q: QueryResult<T>
  ): Promise<{
    schema: T;
    query: string;
    data?: z.infer<T>;
    error?: Error;
  }> => {
    try {
      const tree = parse(q.query);
      const _ = await evaluate(tree, { dataset });
      const rawRes = await _.get();

      const data = q.schema.parse(rawRes);
      return { data, query: q.query, schema: q.schema };
    } catch (err) {
      return { query: q.query, schema: q.schema, error: err as Error };
    }
  };

export const runPokemonQuery = makeQueryRunner(pokemonDataset);
