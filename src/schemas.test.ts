import { describe, expect, it } from "vitest";
import { runPokemonQuery, runUserQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("string", () => {
  it("will generate a string type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("name", q.string())
    );

    expect(data === "Bulbasaur").toBeTruthy();
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

    expect(data === 45).toBeTruthy();
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

    expect(data === true).toBeTruthy();
  });
});

describe("unknown", () => {
  it("will generate an unknown type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("base", q.unknown())
    );

    // @ts-expect-error Unknown type, shouldn't "know" properties
    expect(data.HP === 45).toBeTruthy();
  });
});

describe("null", () => {
  it("will generate an null type", async () => {
    const { data } = await runPokemonQuery(
      q("*").filter("_type == 'pokemon'").slice(0).grabOne("notThere", q.null())
    );

    expect(data === null).toBeTruthy();
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
    expect(name === "Bulbasaur").toBeTruthy();
    // @ts-expect-error Anything but Bulbasaur should throw type error
    expect(name === "Charmander").toBeFalsy();
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
    expect(hp === 45).toBeTruthy();
    // @ts-expect-error Anything but 45 should throw type error
    expect(hp === 50).toBeFalsy();
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
    expect(data[0].name === "Bulbasaur").toBeTruthy();
    expect(data[1].name === "Ivysaur").toBeTruthy();
    // @ts-expect-error Anything but Bulbasaur or Ivysaur should throw type error
    expect(data[0].name === "Charmander").toBeFalsy();
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
    expect(id === "pokemon.1").toBeTruthy();
    expect(id === 1).toBeFalsy();
    // @ts-expect-error Anything but number or string should throw type error
    expect(id === false).toBeFalsy();
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
    expect(data[0].name).toBe("John");
    expect(data[0].nicknames).toEqual(["Johnny", "J Boi", "Dat Boi Doe"]);
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
    expect(data.types[0]._type === "reference").toBeTruthy();
    expect(data.types[0]._ref === "type.Grass").toBeTruthy();
  });
});

describe("contentBlock", () => {
  it("can handle content blocks", async () => {
    const { data, query } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .slice(0)
        .grab({
          name: q.string(),
          bio: q.array(q.contentBlock()),
        })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
  });
});

describe("contentBlock", () => {
  it("can handle content blocks", async () => {
    const { data, query } = await runUserQuery(
      q("*").filter("_type == 'user'").slice(0).grab({
        name: q.string(),
        bio: q.contentBlocks(),
      })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
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
    expect(typeof data.slug).toBe("string");
    expect(data.slug === "john").toBeTruthy();
  });
});
