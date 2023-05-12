import invariant from "tiny-invariant";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";

describe("q.select()", () => {
  it("creates query from {condition: selection} composition", () => {
    const { query, schema } = q.select({
      "foo > 2": {
        bar: z.boolean(),
      },
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => { bar }, { baz })");
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      { bar: boolean } | { baz: string }
    >();
  });

  it("creates query from {condition: q()} composition", () => {
    const { query, schema } = q.select({
      "foo > 2": q("bar").grab({
        bar: z.boolean(),
      }),
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => bar{bar}, { baz })");
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      { bar: boolean } | { baz: string }
    >();
  });

  it("creates query from {condition: [name, schema]} composition", () => {
    const { query, schema } = q.select({
      "foo > 2": ["bar", q.boolean()],
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => bar, { baz })");
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      boolean | { baz: string }
    >();
  });

  it("makes schema nullable when default condition omitted", () => {
    const { query, schema } = q.select({
      "foo > 2": {
        bar: z.boolean(),
      },
    });

    expect(query).toBe("select(foo > 2 => { bar })");
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<{
      bar: boolean;
    } | null>();
  });

  it("handles nested selects properly", () => {
    const nestedSelect = q.select({
      'bar == "thing"': {
        b: q.string(),
      },
      default: {
        c: z.string(),
      },
    });

    const { query, schema } = q.select({
      "foo > 2": nestedSelect,
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe(
      'select(foo > 2 => select(bar == "thing" => { b }, { c }), { baz })'
    );
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      { b: string } | { c: string } | { baz: string }
    >();
  });

  it("handles a nested selection referencing the outer scope", () => {
    const select = q.select({
      "foo > 2": {
        bar: z.boolean(),
      },
      default: {
        baz: z.string(),
      },
    });

    const { query, schema } = q("*").filter().grab({
      foo: select,
    });

    expect(query).toBe('*[]{"foo": select(foo > 2 => { bar }, { baz })}');
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      {
        foo: { bar: boolean } | { baz: string };
      }[]
    >();
  });
});

describe("EntityQuery.select()", () => {
  describe("with standalone select input", () => {
    it("updates query and handles nested object types", () => {
      const standaloneSelect = q.select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").select(standaloneSelect);

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => { bar }, { baz })}"
      );
      expectTypeOf<z.infer<typeof entityQuery.schema>>().toEqualTypeOf<
        { bar: boolean } | { baz: string }
      >();
    });

    it("converts no default condition to empty object", () => {
      const standaloneSelect = q.select({
        "foo > 2": {
          bar: z.boolean(),
        },
      });
      const entityQuery = q("foo").select(standaloneSelect);

      expect(entityQuery.query).toBe("foo{...select(foo > 2 => { bar })}");
      expectTypeOf<z.infer<typeof entityQuery.schema>>().toEqualTypeOf<
        { bar: boolean } | Record<string, never>
      >();
    });

    it("converts primitives to empty object", () => {
      const standaloneSelect = q.select({
        "foo > 2": ["bar", z.boolean()],
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").select(standaloneSelect);

      expect(entityQuery.query).toBe("foo{...select(foo > 2 => bar, { baz })}");
      expectTypeOf<z.infer<typeof entityQuery.schema>>().toEqualTypeOf<
        Record<string, never> | { baz: string }
      >();
    });

    it("handles nested union types properly", () => {
      const nestedSelect = q.select({
        "foo == 3": ["a", q.string()],
        default: {
          b: q.boolean(),
        },
      });

      const standaloneSelect = q.select({
        "foo > 2": nestedSelect,
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").select(standaloneSelect);

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => select(foo == 3 => a, { b }), { baz })}"
      );
      expectTypeOf<z.infer<typeof entityQuery.schema>>().toEqualTypeOf<
        Record<string, never> | { b: boolean } | { baz: string }
      >();
    });
  });

  describe("with {condition: Selection} input", () => {
    it("updates query and handles nested object types", () => {
      const entityQuery = q("foo").select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => { bar }, { baz })}"
      );
      expectTypeOf<z.infer<typeof entityQuery.schema>>().toEqualTypeOf<
        { bar: boolean } | { baz: string }
      >();
    });
  });
});

describe("EntityQuery.select$()", () => {
  it("can coerce null values to undefined", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filterByType("pokemon")
        .slice(0)
        .select$({
          "name == 'Bulbasaur'": {
            name: q.literal("Bulbasaur"),
            foo: q.string().optional(),
          },
        })
    );

    invariant(data);
    expectTypeOf(data)
      .exclude<Record<string, never>>()
      .toEqualTypeOf<{ name: "Bulbasaur"; foo?: string }>();
    expect(data.name).toBe("Bulbasaur");
    expect(data.foo).toBe(undefined);
  });

  it("can coerce null values to undefined with default value", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filterByType("pokemon")
        .slice(0)
        .select$({
          "name == 'Bulbasaur'": {
            name: q.literal("Bulbasaur"),
            foo: q.string().optional().default("bar"),
          },
        })
    );

    invariant(data);
    expectTypeOf(data)
      .exclude<Record<string, never>>()
      .toEqualTypeOf<{ name: "Bulbasaur"; foo: string }>();
  });

  it("can coerce null values in default selection to undefined", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filterByType("pokemon")
        .slice(0)
        .select$({
          "name == 'Charmander'": {
            name: q.literal("Charmander"),
          },
          default: {
            foo: q.string().optional(),
          },
        })
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      { name: "Charmander" } | { foo?: string }
    >();
    if ("foo" in data) expect(data.foo).toBe(undefined);
  });
});

describe("ArrayQuery.select()", () => {
  it("handles standalone select input", () => {
    const standaloneSelect = q.select({
      "foo > 2": {
        bar: z.boolean(),
      },
      default: {
        baz: z.string(),
      },
    });
    const query = q("*").filter().select(standaloneSelect);

    expect(query.query).toBe("*[]{...select(foo > 2 => { bar }, { baz })}");
    expectTypeOf<z.infer<typeof query.schema>>().toEqualTypeOf<
      ({ bar: boolean } | { baz: string })[]
    >();
  });

  it("handles {condition: Selection} input", () => {
    const query = q("*")
      .filter()
      .select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });

    expect(query.query).toBe("*[]{...select(foo > 2 => { bar }, { baz })}");
    expectTypeOf<z.infer<typeof query.schema>>().toEqualTypeOf<
      ({ bar: boolean } | { baz: string })[]
    >();
  });
});

describe("select() zod validations", () => {
  it("validates field based select queries correctly", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter('_type == "pokemon"')
        .grab({
          name: q.string(),
          hp: q.select({
            "base.HP > 50": ['"high"', q.literal("high")],
            default: ['"low"', q.literal("low")],
          }),
        })
    );

    expect(query).toBe(
      '*[_type == "pokemon"]{name, "hp": select(base.HP > 50 => "high", "low")}'
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      {
        name: string;
        hp: "high" | "low";
      }[]
    >();
    expect(data).toContainEqual({
      name: "Kakuna",
      hp: "low",
    });
    expect(data).toContainEqual({
      name: "Butterfree",
      hp: "high",
    });
  });

  it("validates entity queries correctly", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter('_type == "pokemon"')
        .grab({
          name: q.string(),
          base: q("base").select({
            "HP > 50": {
              Defense: q.number(),
            },
            default: {
              Speed: q.number(),
            },
          }),
        })
    );

    expect(query).toBe(
      '*[_type == "pokemon"]{name, "base": base{...select(HP > 50 => { Defense }, { Speed })}}'
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      {
        name: string;
        base: { Defense: number } | { Speed: number };
      }[]
    >();
    expect(data).toContainEqual({
      name: "Weedle",
      base: {
        Speed: 50,
      },
    });
    expect(data).toContainEqual({
      name: "Butterfree",
      base: {
        Defense: 50,
      },
    });
  });

  it("validates array queries correctly", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("name == 'Bulbasaur' || name == 'Charmander'")
        .select({
          "name == 'Bulbasaur'": {
            _id: q.string(),
            name: q.literal("Bulbasaur"),
            hp: ["base.HP", q.number()],
          },
          default: {
            _id: q.string(),
            name: q.literal("Charmander"),
            attack: ["base.Attack", q.number()],
          },
        })
    );

    expect(query).toBe(
      "*[name == 'Bulbasaur' || name == 'Charmander']{...select(name == 'Bulbasaur' => { _id, name, \"hp\": base.HP }, { _id, name, \"attack\": base.Attack })}"
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      Array<
        | {
            _id: string;
            name: "Bulbasaur";
            hp: number;
          }
        | {
            _id: string;
            name: "Charmander";
            attack: number;
          }
      >
    >();
    expect(data).toHaveLength(2);
    expect(data).toContainEqual({
      _id: "pokemon.1",
      name: "Bulbasaur",
      hp: 45,
    });
    expect(data).toContainEqual({
      _id: "pokemon.4",
      name: "Charmander",
      attack: 52,
    });
  });

  it("validates empty objects correctly", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter('_type == "pokemon"')
        .select({
          'name == "Bulbasaur"': {
            name: q.literal("Bulbasaur"),
          },
        })
    );

    expect(query).toBe(
      '*[_type == "pokemon"]{...select(name == "Bulbasaur" => { name })}'
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      Array<
        | {
            name: "Bulbasaur";
          }
        | Record<string, never>
      >
    >();
    expect(data).toContainEqual({
      name: "Bulbasaur",
    });
    expect(data).toContainEqual({});
  });

  it("validates with single default conditional", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter('_type == "pokemon"')
        .select({
          default: {
            name: q.string(),
          },
        })
    );

    expect(query).toBe('*[_type == "pokemon"]{...select({ name })}');
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      Array<{
        name: string;
      }>
    >();
    expect(data).toContainEqual({
      name: "Bulbasaur",
    });
  });

  it("validates null field correctly", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter('_type == "pokemon"')
        .grab({
          name: q.select({
            'name == "not a pokemon"': ["name", q.string()],
          }),
        })
    );

    expect(query).toBe(
      '*[_type == "pokemon"]{"name": select(name == "not a pokemon" => name)}'
    );
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      Array<{
        name: null | string;
      }>
    >();

    data.every((selection) => {
      expect(selection).toStrictEqual({
        name: null,
      });
    });
  });
});
