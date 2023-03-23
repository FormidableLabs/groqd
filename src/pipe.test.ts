import { describe, expect, expectTypeOf, it } from "vitest";
import { UnknownArrayQuery, UnknownQuery } from "./builder";
import { q } from "./index";
import { runPokemonQuery } from "../test-utils/runQuery";
import invariant from "tiny-invariant";

describe("pipe", () => {
  it("returns instance of UnknownQuery with query set to first arg", () => {
    const result = q("foo");
    expect(result).toBeInstanceOf(UnknownQuery);
    expect(result.query).toBe("foo");
  });

  it("can return instance of UnknownArrayQuery when isArray is true", () => {
    const result = q("foo", { isArray: true });
    expect(result).toBeInstanceOf(UnknownArrayQuery);
    expect(result.query).toBe("foo");
  });

  it("can chain .grab$ after q() if isArray = true", async () => {
    const { data, query } = await runPokemonQuery(
      q("*[_type == 'pokemon'][0..2]", { isArray: true }).grab$({
        name: q.string(),
      })
    );

    expect(query).toBe("*[_type == 'pokemon'][0..2]{name}");
    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{ name: string }[]>();
    expect(data[0].name).toBe("Bulbasaur");
  });
});
