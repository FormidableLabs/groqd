import { describe, expect, expectTypeOf, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { nullToUndefined, q } from "./index";
import invariant from "tiny-invariant";

describe("nullToUndefined", () => {
  it("casts for single fields", async () => {
    const { data, query } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .grab({
          name: q.string(),
          foo: nullToUndefined(q.string().optional()),
          bar: nullToUndefined(q.string().optional().default("baz")),
        })
        .slice(0)
    );

    expect(query).toBe(`*[_type == 'pokemon']{name, foo, bar}[0]`);

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{
      name: string;
      foo?: string | undefined;
      bar: string;
    }>();
    expect(data).toEqual({ name: "Bulbasaur", foo: undefined, bar: "baz" });
  });

  it("casts for whole selection", async () => {
    const { data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0)
        .grab(
          nullToUndefined({
            name: q.string(),
            foo: q.string().optional(),
            bar: q.string().optional().default("baz"),
          })
        )
    );

    invariant(data);
    expectTypeOf(data).toEqualTypeOf<{
      name: string;
      foo?: string | undefined;
      bar: string;
    }>();
    expect(data).toEqual({ name: "Bulbasaur", foo: undefined, bar: "baz" });
  });
});
