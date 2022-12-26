import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";
import invariant from "tiny-invariant";

describe("grab", () => {
  it("creates schema from unknown array schema", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.grab({ name: q.string() }))
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data[0].name).toBe("Bulbasaur");
  });

  it("creates schema from unknown singleton schema", async () => {
    const { schema, data } = await runPokemonQuery(
      q("", q.grab({ name: q.null() }))
    );

    expect(schema instanceof z.ZodObject);
    expect(data).toEqual({ name: null });
  });

  it("can grab with {key: [name, schema]} syntax", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ hp: ["base.HP", q.number()] })
      )
    );

    expect(query).toBe(`*[_type == 'pokemon']{"hp": base.HP}`);
    expect(
      schema instanceof z.ZodArray && schema.element instanceof z.ZodObject
    );
    invariant(data);
    expect(data[0].hp).toBe(45);
  });

  it("can grab with {key: schema} shorthand", async () => {
    const { query, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.grab({ name: q.string() }))
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}`);
    expect(data?.[0]?.name).toBe("Bulbasaur");
  });

  it("can grab with {key: q()} composition", async () => {
    const { query, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'poketype'"),
        q.slice(0),
        q.grab({
          name: q.string(),
          pokemons: q(
            "*",
            q.filter("_type == 'pokemon' && references(^._id)"),
            q.grab({ name: q.string() })
          ),
        })
      )
    );

    expect(query).toBe(
      `*[_type == 'poketype'][0]{name, "pokemons": *[_type == 'pokemon' && references(^._id)]{name}}`
    );
    invariant(data);
    expect(data.name).toBe("Grass");
    expect(data.pokemons[0].name).toBe("Bulbasaur");
  });

  it("can handle coalesce statements", async () => {
    const { query, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0, 3),
        q.grab({
          strength: ["coalesce(attack, base.Attack)", q.number()],
        })
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..3]{"strength": coalesce(attack, base.Attack)}`
    );
    invariant(data);
    expect(data[0].strength).toBe(49);
  });

  it.only("can handle conditional selections", async () => {
    const { data, query, error } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0, 3),
        q.grab({
          _id: q.string(),
          "name == 'Bulbasaur' =>": {
            name: q.literal("Bulbasaur"),
          },
          "name == 'Charmander' =>": {
            name: q.literal("Charmander"),
            hp: ["base.HP", q.number()],
          },
        })
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..3]{_id, name == 'Bulbasaur' => {name}, name == 'Charmander' => {name,"hp": base.HP}}`
    );

    invariant(data);

    for (const dat of data) {
      if (dat.name === "Charmander") {
        expect(dat.name === "Charmander").toBeTruthy();
        // @ts-expect-error Expect error here, TS should infer type
        expect(dat.name === "Bulbasaur").toBeFalsy();
        expect(dat.hp).toBe(39);
      }
    }
  });
});

// TODO: test for stacked grabs, make sure picking works correctly.
