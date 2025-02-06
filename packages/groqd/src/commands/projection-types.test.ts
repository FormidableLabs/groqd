import { describe, expectTypeOf, it } from "vitest";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";

describe("projection-types", () => {
  describe("Projection Keys (naked projections)", () => {
    type Item = {
      str: string;
      num?: number;
      arr: Array<string>;
      nested: {
        str?: string;
        bool: true;
        arr: Array<number>;
      };
      optional?: {
        str: string;
      };
    };
    type Keys = ProjectionKey<Item>;

    describe("ProjectionKey", () => {
      it("should extract simple types", () => {
        expectTypeOf<
          ProjectionKey<{ str: string; num: number }>
        >().toEqualTypeOf<"str" | "num">();
      });
      it("should extract nested types", () => {
        expectTypeOf<
          ProjectionKey<{ str: string; nested: { num: number; bool: boolean } }>
        >().toEqualTypeOf<"str" | "nested" | "nested.num" | "nested.bool">();
      });
      it("should extract arrays", () => {
        expectTypeOf<ProjectionKey<{ arr: Array<string> }>>().toEqualTypeOf<
          "arr" | "arr[]"
        >();
      });
      it("should extract nested arrays", () => {
        type Keys = ProjectionKey<{
          nested: { arr: Array<string> };
        }>;
        expectTypeOf<Keys>().toEqualTypeOf<
          "nested" | "nested.arr" | "nested.arr[]"
        >();
      });
      it("should not extract nested optional props", () => {
        type Keys = ProjectionKey<{
          nested?: { num: number };
        }>;
        expectTypeOf<Keys>().toEqualTypeOf<"nested">();
      });

      it("should extract all the deeply nested types", () => {
        expectTypeOf<Keys>().toEqualTypeOf<
          | "str"
          | "num"
          | "arr"
          | "arr[]"
          | "nested"
          | "nested.str"
          | "nested.bool"
          | "nested.arr"
          | "nested.arr[]"
          | "optional"
        >();
      });
    });

    describe("ProjectionKeyValue", () => {
      it("should extract the correct types for each projection", () => {
        expectTypeOf<ProjectionKeyValue<Item, "str">>().toEqualTypeOf<string>();
        expectTypeOf<ProjectionKeyValue<Item, "num">>().toEqualTypeOf<
          number | null
        >();
        expectTypeOf<ProjectionKeyValue<Item, "arr">>().toEqualTypeOf<
          Array<string>
        >();
        expectTypeOf<ProjectionKeyValue<Item, "arr[]">>().toEqualTypeOf<
          Array<string>
        >();
        expectTypeOf<ProjectionKeyValue<Item, "nested">>().toEqualTypeOf<
          Item["nested"]
        >();
        expectTypeOf<ProjectionKeyValue<Item, "nested.str">>().toEqualTypeOf<
          string | null
        >();
        expectTypeOf<
          ProjectionKeyValue<Item, "nested.bool">
        >().toEqualTypeOf<true>();
        expectTypeOf<ProjectionKeyValue<Item, "nested.arr">>().toEqualTypeOf<
          Array<number>
        >();
        expectTypeOf<ProjectionKeyValue<Item, "nested.arr[]">>().toEqualTypeOf<
          Array<number>
        >();
        expectTypeOf<ProjectionKeyValue<Item, "optional.str">>().toEqualTypeOf<
          // @ts-expect-error -- Currently this isn't supported, so it's cast as 'never'
          string | null
        >();
      });
    });
  });
});
