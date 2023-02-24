import { describe, it, expectTypeOf } from "vitest";
import { q } from ".";
import { type FromSelection, grab } from "./grab";
import type { EntityQuery } from "./builder";
import type { ZodNumber, ZodString } from "zod";
import { ValueOf } from "./types";

describe("grab", () => {
  it("has correct type with simple grab", () => {
    expectTypeOf(grab("", q.object({}), { name: q.string() })).toEqualTypeOf<
      EntityQuery<FromSelection<{ name: ZodString }>>
    >();
  });

  it("has correct type with conditional grab", () => {
    const result = grab(
      "",
      q.object({}),
      {},
      {
        "_type == 'pokemon'": {
          index: q.string(),
        },
        "_type == 'digimon'": {
          index: q.number(),
        },
      }
    );

    expectTypeOf(result).toEqualTypeOf<
      EntityQuery<
        ValueOf<{
          "_type == 'pokemon'": FromSelection<{ index: ZodString }>;
          "_type == 'digimon'": FromSelection<{ index: ZodNumber }>;
        }>
      >
    >();
  });
});
