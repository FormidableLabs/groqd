import { describe, it } from "vitest";
import { ProjectionKey, ProjectionKeyValue } from "./projection-types";
import { expectType } from "../tests/expectType";

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
        expectType<ProjectionKey<{ str: string; num: number }>>().toStrictEqual<
          "str" | "num"
        >();
      });
      it("should extract nested types", () => {
        expectType<
          ProjectionKey<{ str: string; nested: { num: number; bool: boolean } }>
        >().toStrictEqual<"str" | "nested" | "nested.num" | "nested.bool">();
      });
      it("should extract arrays", () => {
        expectType<ProjectionKey<{ arr: Array<string> }>>().toStrictEqual<
          "arr" | "arr[]"
        >();
      });
      it("should extract nested arrays", () => {
        type Keys = ProjectionKey<{
          nested: { arr: Array<string> };
        }>;
        expectType<Keys>().toStrictEqual<
          "nested" | "nested.arr" | "nested.arr[]"
        >();
      });
      it("should extract nested optional props", () => {
        type Keys = ProjectionKey<{
          nested?: { num: number };
        }>;
        expectType<Keys>().toStrictEqual<"nested" | "nested.num">();
      });

      it("should extract all the deeply nested types", () => {
        expectType<Keys>().toStrictEqual<
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
          | "optional.str"
        >();
      });
    });

    describe("ProjectionKeyValue", () => {
      it("should extract the correct types for each projection", () => {
        expectType<ProjectionKeyValue<Item, "str">>().toStrictEqual<string>();
        expectType<ProjectionKeyValue<Item, "num">>().toStrictEqual<
          number | null
        >();
        expectType<ProjectionKeyValue<Item, "arr">>().toStrictEqual<
          Array<string>
        >();
        expectType<ProjectionKeyValue<Item, "arr[]">>().toStrictEqual<
          Array<string>
        >();
        expectType<ProjectionKeyValue<Item, "nested">>().toStrictEqual<
          Item["nested"]
        >();
        expectType<ProjectionKeyValue<Item, "nested.str">>().toStrictEqual<
          string | null
        >();
        expectType<
          ProjectionKeyValue<Item, "nested.bool">
        >().toStrictEqual<true>();
        expectType<ProjectionKeyValue<Item, "nested.arr">>().toStrictEqual<
          Array<number>
        >();
        expectType<ProjectionKeyValue<Item, "nested.arr[]">>().toStrictEqual<
          Array<number>
        >();
        expectType<ProjectionKeyValue<Item, "optional.str">>().toStrictEqual<
          // @ts-expect-error -- Currently this isn't supported, so it's cast as 'never'
          string | null
        >();
      });
    });
  });
});
