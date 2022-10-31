import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";
import invariant from "tiny-invariant";

describe("grabOne", () => {
  it("if input is array, converts to array of given type", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0, 2),
        q.grabOne("name", q.string())
      )
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2].name`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodString
    );
    invariant(data);
    expect(data).toEqual(["Bulbasaur", "Ivysaur", "Venusaur"]);
  });

  it("if input is not array, convert to schema type", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0),
        q.grabOne("name", q.string())
      )
    );

    expect(query).toBe(`*[_type == 'pokemon'][0].name`);
    expect(schema instanceof z.ZodString);
    expect(data).toBe("Bulbasaur");
  });
});
