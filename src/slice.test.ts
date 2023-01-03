import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";
import invariant from "tiny-invariant";

describe("slice", () => {
  it("turns unknown[] to unknown if no max provided", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.slice(0))
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]`);
    expect(schema instanceof z.ZodUnknown);
    invariant(data);
    expect("name" in data).toBeTruthy();
  });

  it("keeps unknown[] as unknown[] if max provided", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.slice(0, 2))
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2]`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodUnknown
    );
    invariant(data);
    expect(data.length).toBe(3);
  });

  it("turns T[] to T if no max provided", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ name: q.string() }),
        q.slice(0)
      )
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[0]`);
    expect(schema instanceof z.ZodObject);
    invariant(data);
    expect(data.name).toBe("Bulbasaur");
  });

  it("keeps T[] as T[] if max provided", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ name: q.string() }),
        q.slice(0, 2)
      )
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[0..2]`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data).toEqual([
      { name: "Bulbasaur" },
      { name: "Ivysaur" },
      { name: "Venusaur" },
    ]);
  });

  it("keeps T[] as T[] if max is provided, even during conditional selection", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab(
          {},
          {
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
              hp: ["base.HP", q.number()],
            },
          }
        ),
        q.slice(0, 2)
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon']{...select(name == 'Bulbasaur' => { name, "hp": base.HP })}[0..2]`
    );
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data).toEqual([{ name: "Bulbasaur", hp: 45 }, {}, {}]);
  });
});
