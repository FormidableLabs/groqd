import { z } from "zod";
import { evaluate, parse } from "groq-js";
import { pokemonDataset } from "./pokemon";
import { BaseQuery } from "../src/builder";
import { userDataset } from "./users";

const makeQueryRunner =
  (dataset: any[]) =>
  async <T extends z.ZodType>(
    pipeVal: BaseQuery<T>
  ): Promise<{
    schema: T;
    query: string;
    data?: z.infer<T>;
    error?: Error;
  }> => {
    try {
      const tree = parse(pipeVal.query);
      const _ = await evaluate(tree, { dataset });
      const rawRes = await _.get();

      // console.log(JSON.stringify(rawRes, null, 2));

      const data = pipeVal.schema.parse(rawRes);
      return { data, query: pipeVal.query, schema: pipeVal.schema };
    } catch (err) {
      return {
        query: pipeVal.query,
        schema: pipeVal.schema,
        error: err as Error,
      };
    }
  };

export const runPokemonQuery = makeQueryRunner(pokemonDataset);

export const runUserQuery = makeQueryRunner(userDataset);
