import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("grabOne", () => {
  it("will deref a referenced value", async () => {
    const { data, query } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.slice(0),
        q.grab({
          name: q.string(),
          types: q(
            "types",
            q.filter(),
            q.deref(),
            q.grabOne("name", q.string())
          ),
        })
      )
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0]{name, "types": types[]->.name}`
    );
    invariant(data);
    expect(data.name).toBe("Bulbasaur");
    expect(data.types).toEqual(["Grass", "Poison"]);
  });

  it("doesnt like trying to dereference a non-reference value", async () => {
    const { error } = await runPokemonQuery(
      // @ts-expect-error expecting error here
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({ name: q.string() }),
        // @ts-expect-error you shouldn't be able to deref a standard object
        q.deref()
      )
    );

    expect(error).toBeTruthy();
  });
});
