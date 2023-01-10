import { describe, it, expect } from "vitest";
import { pipe } from "./builder";
import { z } from "zod";
import {
  runPokemonBuilderQuery,
  runPokemonQuery,
} from "../test-utils/runQuery";
import invariant from "tiny-invariant";
import { q } from "./index";

describe("PipeArray.grab", () => {
  it("creates schema from unknown array schema", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").grab({ name: z.string() })
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data[0].name).toBe("Bulbasaur");
  });

  it("can grab with {key: [name, schema]} syntax", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab({
          hp: ["base.HP", z.number()],
        })
    );

    expect(query).toBe(`*[_type == 'pokemon']{"hp": base.HP}`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data[0].hp).toBe(45);
  });

  it("can grab with {key: pipe()} composition", async () => {
    const { query, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'poketype'")
        .slice(0, 1)
        .grab({
          name: z.string(),
          pokemons: pipe("*")
            .filter("_type == 'pokemon' && references(^._id)")
            .grab({ name: z.string() }),
        })
    );

    expect(query).toBe(
      `*[_type == 'poketype'][0..1]{name, "pokemons": *[_type == 'pokemon' && references(^._id)]{name}}`
    );
    invariant(data);
    expect(data[0].name).toBe("Grass");
    expect(data[0].pokemons[0].name).toBe("Bulbasaur");
  });

  it("can handle coalesce statements", async () => {
    const { query, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .slice(0, 3)
        .grab({
          strength: ["coalesce(attack, base.Attack)", z.number()],
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..3]{"strength": coalesce(attack, base.Attack)}`
    );
    invariant(data);
    expect(data[0].strength).toBe(49);
  });
});

describe("PipeUnknown.filter/PipeArray.filter", () => {
  it("applies simple filter appropriately to PipeUnknown, returning unknown array", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'")
    );

    expect(query).toBe(`*[_type == 'pokemon']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    expect(Array.isArray(data) && "name" in data[0]).toBeTruthy();
  });

  it("can stack filters, with no projection, schema is still unknown", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").filter("name match 'char*'")
    );

    expect(query).toBe(`*[_type == 'pokemon'][name match 'char*']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    expect(data?.length).toBe(3);
  });

  it("can filter, project, and filter, and schema of projection is preserved", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string() })
        .filter("name match 'char*'")
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[name match 'char*']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodObject).toBeTruthy();
    invariant(data);
    expect(data[0].name).toEqual("Charmander");
  });

  it("turns unknown schema into unknown array schema", async () => {
    const { schema: schema1 } = await runPokemonBuilderQuery(pipe(""));
    expect(schema1 instanceof z.ZodUnknown);

    const { schema: schema2 } = await runPokemonBuilderQuery(
      pipe("").filter("_type == 'animal'")
    );
    expect(
      schema2 instanceof z.ZodArray && schema2.element instanceof z.ZodUnknown
    );
  });
});

describe("PipeArray.order", () => {
  it("applies order, preserves unknown schema", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").order("name asc")
    );

    expect(query).toBe(`*[_type == 'pokemon']|order(name asc)`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    // @ts-expect-error data is unknown type since no grab present
    expect(data?.[0]?.name).toBe("Abra");
  });

  it("applies order, preserves schema", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string() })
        .order("name desc")
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}|order(name desc)`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodObject).toBeTruthy();
    invariant(data);
    expect(data[0].name).toBe("Zubat");
  });

  it("can apply multiple order statements", async () => {
    const { query, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string(), hp: ["base.HP", z.number()] })
        .order("hp desc", "name asc")
    );

    expect(query).toBe(
      `*[_type == 'pokemon']{name, "hp": base.HP}|order(hp desc, name asc)`
    );
    invariant(data);
    expect(data[0].name).toBe("Chansey");
  });
});

describe("PipeArray.slice", () => {
  it("turns unknown[] to unknown if no max provided", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").slice(0)
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]`);
    expect(schema instanceof z.ZodUnknown);
    invariant(data);
    expect("name" in data).toBeTruthy();
  });

  it("keeps unknown[] as unknown[] if max provided", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").slice(0, 2)
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2]`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodUnknown
    );
    invariant(data);
    expect(data.length).toBe(3);
  });

  it("turns T[] to T if no max provided", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*").filter("_type == 'pokemon'").grab({ name: z.string() }).slice(0)
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[0]`);
    expect(schema instanceof z.ZodObject);
    invariant(data);
    expect(data.name).toBe("Bulbasaur");
  });

  it("keeps T[] as T[] if max provided", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string() })
        .slice(0, 2)
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

  it("turns T[] to T if no max provided, even during conditional selection", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab(
          {},
          {
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
              hp: ["base.HP", q.number()],
            },
          }
        )
        .slice(0)
    );

    expect(query).toBe(
      `*[_type == 'pokemon']{...select(name == 'Bulbasaur' => { name, "hp": base.HP })}[0]`
    );
    expect(schema instanceof z.ZodObject);
    invariant(data);
    expect(data).toEqual({ name: "Bulbasaur", hp: 45 });
  });

  it("keeps T[] as T[] if max is provided, even during conditional selection", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .grab(
          {},
          {
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
              hp: ["base.HP", q.number()],
            },
          }
        )
        .slice(0, 2)
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

describe("PipeArray.grabOne/PipeSingleEntity.grabOne", () => {
  it("if input is array, converts to array of given type", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .slice(0, 2)
        .grabOne("name", z.string())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2].name`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodString
    );
    invariant(data);
    expect(data).toEqual(["Bulbasaur", "Ivysaur", "Venusaur"]);
  });

  it("if input is not array, convert to schema type", async () => {
    const { query, schema, data } = await runPokemonBuilderQuery(
      pipe("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grabOne("name", z.string())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0].name`);
    expect(schema instanceof z.ZodString);
    expect(data).toBe("Bulbasaur");
  });
});
