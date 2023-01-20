import { describe, expect, it } from "vitest";
import { runPokemonQuery, runUserQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

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
