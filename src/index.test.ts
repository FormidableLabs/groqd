import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

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
