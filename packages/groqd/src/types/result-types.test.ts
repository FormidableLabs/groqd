import { describe, expectTypeOf, it } from "vitest";
import { ResultItem, ResultUtils } from "./result-types";

describe("ResultItem (namespace)", () => {
  type Item = { ITEM: "ITEM" };

  it("Override", () => {
    expectTypeOf<ResultItem.Override<Array<Item>, "NEW-ITEM">>().toEqualTypeOf<
      Array<"NEW-ITEM">
    >();
    expectTypeOf<
      ResultItem.Override<Array<Item> | null, "NEW-ITEM">
    >().toEqualTypeOf<Array<"NEW-ITEM"> | null>();
  });

  it("Infer", () => {
    expectTypeOf<ResultItem.Infer<Array<Item>>>().toEqualTypeOf<Item>();
    expectTypeOf<ResultItem.Infer<Array<Item> | null>>().toEqualTypeOf<Item>();
  });

  it("InferMaybe", () => {
    expectTypeOf<ResultItem.InferMaybe<Array<Item>>>().toEqualTypeOf<Item>();
    expectTypeOf<
      ResultItem.InferMaybe<Array<Item> | null>
    >().toEqualTypeOf<Item | null>();
  });

  describe("ResultUtils (internal)", () => {
    it("Wrap", () => {
      type ArrayResult = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      };
      expectTypeOf<ResultUtils.Wrap<ArrayResult>>().toEqualTypeOf<
        Array<Item>
      >();

      type SingleItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      };
      expectTypeOf<ResultUtils.Wrap<SingleItem>>().toEqualTypeOf<Item>();

      type NullableItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      };
      expectTypeOf<ResultUtils.Wrap<NullableItem>>().not.toEqualTypeOf<Item>();
      expectTypeOf<
        ResultUtils.Wrap<NullableItem>
      >().toEqualTypeOf<Item | null>();

      type NullableArray = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      };
      expectTypeOf<
        ResultUtils.Wrap<NullableArray>
      >().toEqualTypeOf<Array<Item> | null>();
    });

    it("Unwrap", () => {
      expectTypeOf<ResultUtils.Unwrap<Item>>().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      }>();
      // IsNullable variants:
      expectTypeOf<ResultUtils.Unwrap<Item | null>>().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectTypeOf<ResultUtils.Unwrap<Item | undefined>>().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectTypeOf<
        ResultUtils.Unwrap<Item | undefined | null>
      >().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      // IsArray variants:
      expectTypeOf<ResultUtils.Unwrap<Array<Item>>>().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      }>();
      expectTypeOf<ResultUtils.Unwrap<Array<Item> | null>>().toEqualTypeOf<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      }>();
    });
  });
});
