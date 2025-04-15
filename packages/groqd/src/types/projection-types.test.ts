import { describe, it, expectTypeOf } from "vitest";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractProjectionResult, ProjectionMap } from "./projection-types";
import { Simplify } from "type-fest";
import { QueryConfig } from "./query-config";

describe("ExtractProjectionResult", () => {
  describe("with a simple projection map", () => {
    type TResultItem = SanitySchema.Variant;

    const projectionMap = {
      _type: true,
      name: true,
      price: true,
    } satisfies ProjectionMap<TResultItem, QueryConfig>;
    it("should extract the correct type", () => {
      type Result = Simplify<
        ExtractProjectionResult<TResultItem, QueryConfig, typeof projectionMap>
      >;
      expectTypeOf<Result>().toEqualTypeOf<{
        _type: "variant";
        name: string;
        price: number;
      }>();
    });
  });
  describe("with naked projections", () => {
    type TResultItem = SanitySchema.Variant;

    const projectionMap = {
      t: "_type",
      name: "name",
      slug: "slug.current",
      image: "images[].name",
    } satisfies ProjectionMap<TResultItem, QueryConfig>;

    it("should extract the correct type", () => {
      type Result = Simplify<
        ExtractProjectionResult<TResultItem, QueryConfig, typeof projectionMap>
      >;
      expectTypeOf<Result>().toEqualTypeOf<{
        t: "variant";
        name: string;
        slug: string;
        image: null | Array<string>;
      }>();
    });
  });
});
