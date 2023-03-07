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
      { bar: boolean } | { baz: string }
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
  it("parses array queries correctly", async () => {
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
});
