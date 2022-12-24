import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";
import { z } from "zod";

describe("literal", () => {
  it("will generate a literal string type", async () => {
    const { data, query } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0),
        q.grab({
          name: q.literal("Bulbasaur"),
        })
      )
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
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0),
        q.grab({
          hp: ["base.HP", q.literal(45)],
        })
      )
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
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0, 1),
        q.grab({
          name: q.union([q.literal("Bulbasaur"), q.literal("Ivysaur")]),
        })
      )
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
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0),
        q.grab({
          _id: q.union([q.number(), q.string()]),
        })
      )
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

describe("playing around", () => {
  it("play", async () => {
    const base = z.object({ _id: z.string() });

    const one = z.object({ name: z.literal("Bulbasaur") });
    const two = z.object({ name: z.literal("Ivysaur") });

    const joined = z.union([base.merge(one), base.merge(two)]);
    type Joined = z.infer<typeof joined>;
  });
});
