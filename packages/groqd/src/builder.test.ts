import { describe, expect, expectTypeOf, it } from "vitest";
import { q } from "./index";
import { z } from "zod";
import { runPokemonQuery, runUserQuery } from "../test-utils/runQuery";
import invariant from "tiny-invariant";

describe("ArrayResult.grab/UnknownResult.grab/EntityResult.grab", () => {
  it("creates schema from unknown array schema", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").grab({ name: z.string() })
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}`);
    invariant(data);

    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data[0].name).toBe("Bulbasaur");
  });

  it("can grab with {key: [name, schema]} syntax", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .grab({
          hp: ["base.HP", z.number()],
        })
    );

    expect(query).toBe(`*[_type == 'pokemon']{"hp": base.HP}`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ hp: number }[]>();
    expect(data[0]).toEqual({ hp: 45 });
  });

  it("can grab with {key: q()} composition", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'poketype'")
        .slice(0, 1)
        .grab({
          name: z.string(),
          pokemon: q("*")
            .filter("_type == 'pokemon' && references(^._id)")
            .slice(0, 1)
            .grab({ name: z.string() }),
        })
    );

    expect(query).toBe(
      `*[_type == 'poketype'][0..1]{name, "pokemon": *[_type == 'pokemon' && references(^._id)][0..1]{name}}`
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      {
        name: string;
        pokemon: { name: string }[];
      }[]
    >();
    expect(data[0]).toEqual({
      name: "Grass",
      pokemon: [{ name: "Bulbasaur" }, { name: "Ivysaur" }],
    });
  });

  it("can handle coalesce statements", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
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
    expectTypeOf(data).toEqualTypeOf<{ strength: number }[]>();
    expect(data[0]).toEqual({ strength: 49 });
  });

  it("creates schema from unknown singleton schema", async () => {
    const { data } = await runPokemonQuery(q("").grab({ name: z.null() }));

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: null }>();
    expect(data).toEqual({ name: null });
  });

  it("can handle conditional selections", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 3)
        .grab(
          {
            _id: z.string(),
          },
          {
            "name == 'Charmander'": {
              name: q.literal("Charmander"),
              hp: ["base.HP", q.number()],
            },
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
              attack: ["base.Attack", q.number()],
            },
          }
        )
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..3]{_id, ...select(name == 'Charmander' => { name, "hp": base.HP }, name == 'Bulbasaur' => { name, "attack": base.Attack })}`
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      (
        | { name: "Charmander"; hp: number; _id: string }
        | { name: "Bulbasaur"; _id: string; attack: number }
        | { _id: string }
      )[]
    >();
    expect(data[0]).toEqual({
      _id: "pokemon.1",
      name: "Bulbasaur",
      attack: 49,
    });
    expect(data[1]).toEqual({ _id: "pokemon.2" });
    expect(data[3]).toEqual({ _id: "pokemon.4", name: "Charmander", hp: 39 });
  });

  it("can stack grabs, and last grab wins", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 3)
        .grab({ name: q.string() })
        .grab({
          foo: ["name", q.string()],
          // let's also query something that doesn't exist – groq will null it out
          bar: q.string().nullable(),
        })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..3]{name}{"foo": name, bar}`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ foo: string; bar: string | null }[]>();
    expect(data[0]).toEqual({ foo: "Bulbasaur", bar: null });
  });
});

describe("grab$", () => {
  it("coerces null to undefined on entity query", async () => {
    const { data, query } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grab$({
        name: q.string(),
        foo: q.string().optional(),
      })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]{name, foo}`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{
      foo?: string | undefined;
      name: string;
    }>();
    expect(data).toEqual({ name: "Bulbasaur", foo: undefined });
  });

  it("coerces null to undefined on array query", async () => {
    const { data, query } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0, 1).grab$({
        name: q.string(),
        foo: q.string().optional(),
      })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..1]{name, foo}`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      { foo?: string | undefined; name: string }[]
    >();
    expect(data[0]).toEqual({ name: "Bulbasaur", foo: undefined });
  });

  it("works nice with default values", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab$({
          name: q.string(),
          foo: q.string().optional().default("bar"),
        })
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string; foo: string }[]>();
    expect(data[0]).toEqual({ name: "Bulbasaur", foo: "bar" });
  });

  it("handles conditional selections", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab$(
          { _id: q.string(), nahBrah: q.number().optional().default(69) },
          {
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
              foo: q.string().optional().default("bar"),
            },
          }
        )
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      | { name: "Bulbasaur"; _id: string; foo: string; nahBrah: number }
      | { _id: string; nahBrah: number }
    >();
    expect("name" in data).toBeTruthy();
    expect("foo" in data).toBeTruthy();

    expect(data.nahBrah).toBe(69);
    if ("name" in data) {
      expect(data.name).toBe("Bulbasaur");
      expect(data.foo).toBe("bar");
    }
  });
});

describe("grabOne$", () => {
  it("coerces null to undefined on entity query", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grabOne$("foo", q.string().optional())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0].foo`);
    expectTypeOf(data).toEqualTypeOf<string | undefined>();
    expect(data).toBeUndefined();
  });

  it("coerces null to undefined on array query", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grabOne$("foo", q.string().optional())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..1].foo`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<(string | undefined)[]>();
    expect(data[0]).toBeUndefined();
    expect(data[1]).toBeUndefined();
  });
});

describe("UnknownResult.filter/ArrayResult.filter", () => {
  it("applies simple filter appropriately to UnknownResult, returning unknown array", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'")
    );

    expect(query).toBe(`*[_type == 'pokemon']`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    expect(Array.isArray(data) && "name" in data[0]).toBeTruthy();
  });

  it("can stack filters, with no projection, schema is still unknown", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").filter("name match 'char*'")
    );

    expect(query).toBe(`*[_type == 'pokemon'][name match 'char*']`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    expect(data?.length).toBe(3);
  });

  it("can filter, project, and filter, and schema of projection is preserved", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string() })
        .filter("name match 'char*'")
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[name match 'char*']`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data[0].name).toEqual("Charmander");
  });

  it("turns unknown schema into unknown array schema", async () => {
    const { schema: schema1 } = await runPokemonQuery(q(""));
    expect(schema1 instanceof z.ZodUnknown);

    const { schema: schema2 } = await runPokemonQuery(
      q("").filter("_type == 'animal'")
    );
    expect(
      schema2 instanceof z.ZodArray && schema2.element instanceof z.ZodUnknown
    );
  });
});

describe("UnknownResult.filterByType/ArrayResult.filterByType", () => {
  it("applies a filterByType to an UnknownResult returning an unkown array", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filterByType("pokemon")
    );

    expect(query).toBe(`*[_type == 'pokemon']`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    expect(Array.isArray(data) && "name" in data[0]).toBeTruthy();
  });

  it("can stack a filter and filterByType, with no projection, schema is still unknown", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filterByType("pokemon").filter("name match 'clef*'")
    );

    expect(query).toBe(`*[_type == 'pokemon'][name match 'clef*']`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    expect(data?.length).toBe(2);
  });

  it("can filterByType, project, and filter, and schema of projection is preserved", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filterByType("pokemon")
        .grab({ name: z.string() })
        .filter("name match 'gen*'")
    );
    expect(query).toBe(`*[_type == 'pokemon']{name}[name match 'gen*']`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data[0].name).toEqual("Gengar");
  });
});

describe("ArrayResult.order", () => {
  it("applies order, preserves unknown schema", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").order("name asc")
    );

    expect(query).toBe(`*[_type == 'pokemon']|order(name asc)`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    // @ts-expect-error data is unknown type since no grab present
    expect(data?.[0]?.name).toBe("Abra");
  });

  it("applies order, preserves schema", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string() })
        .order("name desc")
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}|order(name desc)`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data[0].name).toBe("Zubat");
  });

  it("can apply multiple order statements", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .grab({ name: z.string(), hp: ["base.HP", z.number()] })
        .order("hp desc", "name asc")
    );

    expect(query).toBe(
      `*[_type == 'pokemon']{name, "hp": base.HP}|order(hp desc, name asc)`
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string; hp: number }[]>();
    expect(data[0].name).toBe("Chansey");
  });
});

describe("ArrayResult.slice", () => {
  it("turns unknown[] to unknown if no max provided", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0)
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]`);
    expectTypeOf(data).toEqualTypeOf<unknown>();
    invariant(data);
    // @ts-expect-error data is unknown type since no grab present
    expect("name" in data).toBeTruthy();
  });

  it("keeps unknown[] as unknown[] if max provided", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0, 2)
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2]`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<unknown[]>();
    invariant(data);
    expect(data.length).toBe(3);
  });

  it("turns T[] to T if no max provided", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").grab({ name: z.string() }).slice(0)
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[0]`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }>();
    expect(data.name).toBe("Bulbasaur");
  });

  it("keeps T[] as T[] if max provided", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").grab({ name: z.string() }).slice(0, 2)
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[0..2]`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data).toEqual([
      { name: "Bulbasaur" },
      { name: "Ivysaur" },
      { name: "Venusaur" },
    ]);
  });

  it("turns T[] to T if no max provided, even during conditional selection", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
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
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{} | { name: "Bulbasaur"; hp: number }>();
    expect(data).toEqual({ name: "Bulbasaur", hp: 45 });
  });

  it("keeps T[] as T[] if max is provided, even during conditional selection", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
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
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      ({ name: "Bulbasaur"; hp: number } | {})[]
    >();
    expect(data).toEqual([{ name: "Bulbasaur", hp: 45 }, {}, {}]);
  });
});

describe("ArrayResult.grabOne/EntityResult.grabOne", () => {
  it("if input is array, converts to array of given type", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 2)
        .grabOne("name", z.string())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..2].name`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<string[]>();
    expect(data).toEqual(["Bulbasaur", "Ivysaur", "Venusaur"]);
  });

  it("if input is not array, convert to schema type", async () => {
    const { query, data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("name", z.string())
    );

    expect(query).toBe(`*[_type == 'pokemon'][0].name`);
    expectTypeOf(data).exclude(undefined).toEqualTypeOf<string>();
    expect(data).toBe("Bulbasaur");
  });
});

describe("ArrayResult.deref/UnknownResult.deref", () => {
  it("will deref a referenced value", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab({
          name: z.string(),
          types: q("types").filter().deref().grabOne("name", z.string()),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0]{name, "types": types[]->.name}`
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string; types: string[] }>();
    expect(data.name).toBe("Bulbasaur");
    expect(data.types).toEqual(["Grass", "Poison"]);
  });

  it("can deref on a single unknown result", async () => {
    const { query, data } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .grab({
          name: z.string(),
          role: q("role").deref().grab({ title: q.string() }),
        })
    );

    expect(query).toBe(`*[_type == 'user']{name, "role": role->{title}}`);
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      { name: string; role: { title: string } }[]
    >();
    expect(data[0]).toEqual({ name: "John", role: { title: "guest" } });
  });

  it("doesnt like trying to dereference a non-reference value", async () => {
    expect(() => {
      // @ts-expect-error expecting deref to error, since it's not on ArrayResultUnknown
      q("*").filter("_type == 'pokemon'").grab({ name: z.string() }).deref();
    }).toThrow();
  });
});

describe("BaseQuery.nullable", () => {
  it("will allow a null return value", async () => {
    const { data, error } = await runPokemonQuery(
      q("*")
        .filter("_type == 'digimon'")
        .slice(0)
        .grab({ name: q.string() })
        .nullable()
    );

    expectTypeOf(data)
      .exclude(undefined)
      .toEqualTypeOf<null | { name: string }>();
    expect(data === null).toBeTruthy();
    expect(error).toBeUndefined();
  });
});

describe("ArrayQuery.score", () => {
  it("will pipe through score function", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 8)
        .score(`name match "char*"`)
        .order("_score desc")
        .grabOne("name", z.string())
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..8]|score(name match "char*")|order(_score desc).name`
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<string[]>();
    expect(data).toEqual([
      "Charmander",
      "Charmeleon",
      "Charizard",
      "Bulbasaur",
      "Ivysaur",
      "Venusaur",
      "Squirtle",
      "Wartortle",
      "Blastoise",
    ]);
  });
});
