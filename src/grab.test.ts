import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";
import invariant from "tiny-invariant";

describe("grab", () => {
  it("creates schema from unknown singleton schema", async () => {
    const { schema, data } = await runPokemonQuery(
      q("", q.grab({ name: q.null() }))
    );

    expect(schema instanceof z.ZodObject);
    expect(data).toEqual({ name: null });
  });

  it("can handle conditional selections", async () => {
    const { data, query } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0, 3),
        q.grab(
          {
            _id: q.string(),
          },
          {
            "name == 'Charmander'": {
              name: q.literal("Charmander"),
              hp: ["base.HP", q.number()],
            },
            "name == 'Bulbasaur'": {
              name: q.literal("Bulbasaur"),
            },
          }
        )
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..3]{_id, ...select(name == 'Charmander' => { name, "hp": base.HP }, name == 'Bulbasaur' => { name })}`
    );

    invariant(data);
    expect(data[0]).toEqual({ _id: "pokemon.1", name: "Bulbasaur" });
    expect(data[1]).toEqual({ _id: "pokemon.2" });
    expect(data[3]).toEqual({ _id: "pokemon.4", name: "Charmander", hp: 39 });

    for (const dat of data) {
      if ("name" in dat && dat.name === "Charmander") {
        expect(dat.name === "Charmander").toBeTruthy();
        // @ts-expect-error Expect error here, TS should infer type
        expect(dat.name === "Bulbasaur").toBeFalsy();
        expect(dat.hp).toBe(39);
      }
    }
  });
});

// TODO: test for stacked grabs, make sure picking works correctly.
