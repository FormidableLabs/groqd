import { describe, it, expect, vi } from "vitest";
import { GroqdParseError, q } from ".";
import { makeSafeQueryRunner } from "./makeSafeQueryRunner";
import { runPokemonQuery } from "../test-utils/runQuery";
import { z } from "zod";

describe("makeSafeQueryRunner", () => {
  it("should create a query runner with single argument", async () => {
    const fn = vi.fn(() => Promise.resolve([]));
    const runQuery = makeSafeQueryRunner(fn);

    const res = await runQuery(q("*").filter().grab({ name: q.string() }));
    expect(fn).toHaveBeenCalledWith(`*[]{name}`);
    expect(res).toEqual([]);
  });

  it("should create a query runner with additional args defined by user", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fn = vi.fn((query: string, params: Record<string, unknown>) =>
      Promise.resolve([])
    );
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
    const fn = vi.fn((_query: string) =>
      Promise.resolve([{ things: [{ name: 123 }] }])
    );
    const runQuery = makeSafeQueryRunner((query) => fn(query));
    console.log("Running...");

    try {
      await runQuery(
        q("*")
          .filter()
          .grab({ things: q.array(q.object({ name: q.string() })) })
      );
    } catch (e) {
      expect(e).toBeInstanceOf(GroqdParseError);
      expect(e instanceof Error && e.message).toBe(
        "Error parsing `result[0].things[0].name`: Expected string, received number."
      );
    }
  });
});
