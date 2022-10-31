import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";

describe("order", () => {
  it("applies order, preserves unknown schema", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.order("name asc"))
    );

    expect(query).toBe(`*[_type == 'pokemon']|order(name asc)`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    // @ts-expect-error data is unknown type
    expect(data?.[0]?.name).toBe("Abra");
  });

  it("applies order, preserves schema", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ name: q.string() }),
        q.order("name desc")
      )
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}|order(name desc)`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodObject).toBeTruthy();
    expect(data?.[0]?.name).toBe("Zubat");
  });

  it("can apply multiple order statements", async () => {
    const { query, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ name: q.string(), hp: ["base.HP", q.number()] }),
        q.order("hp desc", "name asc")
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon']{name, "hp": base.HP}|order(hp desc, name asc)`
    );
    expect(data?.[0]?.name).toBe("Chansey");
  });
});
