import { describe, it, expect, vi } from "vitest";
import { GroqdParseError, q } from "./index";
import { makeSafeQueryRunner } from "./makeSafeQueryRunner";
import { runPokemonQuery } from "../test-utils/runQuery";
import invariant from "tiny-invariant";

describe("makeSafeQueryRunner", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fn = vi.fn((query: string, params?: Record<string, unknown>) =>
    Promise.resolve([])
  );

  it("should create a query runner with single argument", async () => {
    const runQuery = makeSafeQueryRunner((q) => fn(q));

    const res = await runQuery(q("*").filter().grab({ name: q.string() }));
    expect(fn).toHaveBeenCalledWith(`*[]{name}`);
    expect(res).toEqual([]);
  });

  it("should create a query runner with additional args defined by user", async () => {
    const runQuery = makeSafeQueryRunner(
      (query, params: Record<string, unknown>) => fn(query, params)
    );

    const res = await runQuery(
      q("*")
        .filter(`_type == 'pokemon' && _id == $id`)
        .grab({ name: q.string() }),
      {
        id: "123",
      }
    );
    expect(fn).toHaveBeenCalledWith(
      `*[_type == 'pokemon' && _id == $id]{name}`,
      { id: "123" }
    );
    expect(res).toEqual([]);
  });

  it("should have better error message", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fn = vi.fn((_query: string) => Promise.resolve({ foo: "bar" }));
    const runQuery = makeSafeQueryRunner((query) => fn(query));

    try {
      await runQuery(q("*").grab({ foo: q.literal("baz") }));
    } catch (e) {
      expect(e).toBeInstanceOf(GroqdParseError);
      expect(e instanceof Error && e.message).toBe(
        'Error parsing:\n\t`result.foo`: Invalid literal value, expected "baz"'
      );
    }
  });

  it("should have better error message (for nested arrays/objects)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fn = vi.fn((_query: string) =>
      Promise.resolve([{ things: [{ name: 123 }], foo: "bar" }])
    );
    const runQuery = makeSafeQueryRunner((query) => fn(query));

    try {
      await runQuery(
        q("*")
          .filter()
          .grab({
            things: q.array(q.object({ name: q.string() })),
            foo: q.literal("baz"),
          })
      );
    } catch (e) {
      expect(e).toBeInstanceOf(GroqdParseError);
      expect(e instanceof Error && e.message).toBe(
        `Error parsing:\n\t\`result[0].things[0].name\`: Expected string, received number\n\t\`result[0].foo\`: Invalid literal value, expected "baz"`
      );
    }
  });

  it("should contain raw response on error", async () => {
    const { error } = await runPokemonQuery(
      q("*").filterByType("pokemon").slice(0, 1).grabOne("name", q.number())
    );

    invariant(error instanceof GroqdParseError);
    expect(error.rawResponse).toEqual(["Bulbasaur", "Ivysaur"]);
  });
});
