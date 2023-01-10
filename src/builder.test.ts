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
