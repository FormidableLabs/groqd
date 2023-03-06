import { describe, expect, expectTypeOf, it } from "vitest";
import { runPokemonQuery, runUserQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("string", () => {
  it("will generate a string type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("name", q.string())
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<string>();
    expect(data).toEqual("Bulbasaur");
  });
});

describe("number", () => {
  it("will generate a number type", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grabOne("base.HP", q.number())
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<number>();
    expect(data).toEqual(45);
  });
});

describe("boolean", () => {
  it("will generate a boolean type", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grabOne("base.HP > 30", q.boolean())
    );

    expectTypeOf(data).exclude(undefined).toEqualTypeOf<boolean>();
    expect(data).toEqual(true);
  });
});

describe("unknown", () => {
  it("will generate an unknown type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("base", q.unknown())
    );

    // @ts-expect-error Unknown type, shouldn't "know" properties
    expectTypeOf(data.HP).toEqualTypeOf<number>();
  });
});

describe("null", () => {
  it("will generate an null type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("notThere", q.null())
    );

    expectTypeOf(data).exclude(undefined).toEqualTypeOf<null>();
    expect(data).toBeNull();
  });
});

describe("literal", () => {
  it("will generate a literal string type", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab({ name: q.literal("Bulbasaur") })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]{name}`);
    invariant(data);
    const name = data.name;

    expectTypeOf(name).toEqualTypeOf<"Bulbasaur">();
    expect(name).toEqual("Bulbasaur");
  });

  it("will generate a literal number type", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab({ hp: ["base.HP", q.literal(45)] })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]{"hp": base.HP}`);
    invariant(data);
    const hp = data.hp;

    expectTypeOf(hp).toEqualTypeOf<45>();
    expect(hp).toEqual(45);
  });
});

describe("union", () => {
  it("will generate a union type (with literals)", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({ name: q.union([q.literal("Bulbasaur"), q.literal("Ivysaur")]) })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..1]{name}`);
    invariant(data);

    expectTypeOf(data[0].name).toEqualTypeOf<"Bulbasaur" | "Ivysaur">();
    expect(data[0].name).toEqual("Bulbasaur");
    expect(data[1].name).toEqual("Ivysaur");
  });

  it("will generate a union type with strings/numbers", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab({ _id: q.union([q.number(), q.string()]) })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]{_id}`);
    invariant(data);
    const id = data._id;

    expectTypeOf(id).toEqualTypeOf<number | string>();
    expect(id).toBe("pokemon.1");
  });
});

describe("array", () => {
  it("allows array type with nested sub-type", async () => {
    const { data } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .grab({
          name: q.string(),
          nicknames: q.array(q.string()).nullable(),
        })
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<
      { name: string; nicknames: string[] | null }[]
    >();
    expect(data[0]).toEqual({
      name: "John",
      nicknames: ["Johnny", "J Boi", "Dat Boi Doe"],
    });
    expect(data[1].nicknames).toBeNull();
  });
});

describe("date", () => {
  it("parses date strings to date objects", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grab({
        createdAt: q.date(),
      })
    );

    invariant(data);
    expectTypeOf(data.createdAt).toEqualTypeOf<Date>();
    expect(data.createdAt).toBeInstanceOf(Date);
  });
});

describe("object", () => {
  it("can handle objects without deeply specifying fields", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab({
          types: q.array(
            q.object({ _type: q.literal("reference"), _ref: q.string() })
          ),
        })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0]{types}`);
    invariant(data);

    expectTypeOf(data.types[0]._type).toEqualTypeOf<"reference">();
    expect(data.types[0]._type).toBe("reference");

    expectTypeOf(data.types[0]._ref).toEqualTypeOf<string>();
    expect(data.types[0]._ref).toBe("type.Grass");
  });
});

describe("slug", () => {
  it("can handle slugs", async () => {
    const { data, query } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .slice(0)
        .grab({
          slug: q.slug("slug"),
        })
    );

    expect(query).toBe(`*[_type == 'user'][0]{"slug": slug.current}`);
    invariant(data);
    expectTypeOf(data.slug).toEqualTypeOf<string>();
    expect(data.slug === "john").toBeTruthy();
  });
});
