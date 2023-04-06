import { z } from "zod";
import { evaluate, parse } from "groq-js";
import { pokemonDataset } from "./pokemon";
import { BaseQuery } from "../src/baseQuery";
import { userDataset } from "./users";
import { GroqdParseError, makeSafeQueryRunner } from "../src";

const _makeRunner =
  (dataset: any[]) =>
  async <T extends z.ZodType>(
    pipeVal: BaseQuery<T>
  ): Promise<{
    schema: T;
    query: string;
    data?: z.infer<T>;
    error?: Error;
  }> => {
    const runner = makeSafeQueryRunner(async (query: string) => {
      const tree = parse(query);
      const _ = await evaluate(tree, { dataset });
      const rawRes = await _.get();

      return rawRes;
    });

    try {
      const data = await runner(pipeVal);

      return { data, query: pipeVal.query, schema: pipeVal.schema };
    } catch (err) {
      return {
        query: pipeVal.query,
        schema: pipeVal.schema,
        error: err as GroqdParseError,
      };
    }
  };

export const runPokemonQuery = _makeRunner(pokemonDataset);

export const runUserQuery = _makeRunner(userDataset);
