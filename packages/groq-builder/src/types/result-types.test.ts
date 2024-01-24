import { describe, it } from "vitest";
import { expectType } from "../tests/expectType";
import { ResultItem, ResultUtils } from "./result-types";

describe("ResultItem (namespace)", () => {
  type Item = { ITEM: "ITEM" };

  it("Override", () => {
    expectType<ResultItem.Override<Array<Item>, "NEW-ITEM">>().toStrictEqual<
      Array<"NEW-ITEM">
    >();
    expectType<
      ResultItem.Override<Array<Item> | null, "NEW-ITEM">
    >().toStrictEqual<Array<"NEW-ITEM"> | null>();
  });

  it("Infer", () => {
    expectType<ResultItem.Infer<Array<Item>>>().toStrictEqual<Item>();
    expectType<ResultItem.Infer<Array<Item> | null>>().toStrictEqual<Item>();
  });

  it("InferMaybe", () => {
    expectType<ResultItem.InferMaybe<Array<Item>>>().toStrictEqual<Item>();
    expectType<
      ResultItem.InferMaybe<Array<Item> | null>
    >().toStrictEqual<Item | null>();
  });

  describe("ResultUtils (internal)", () => {
    it("Wrap", () => {
      type ArrayResult = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      };
      expectType<ResultUtils.Wrap<ArrayResult>>().toStrictEqual<Array<Item>>();

      type SingleItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      };
      expectType<ResultUtils.Wrap<SingleItem>>().toStrictEqual<Item>();

      type NullableItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      };
      expectType<ResultUtils.Wrap<NullableItem>>().not.toStrictEqual<Item>();
      expectType<ResultUtils.Wrap<NullableItem>>().toStrictEqual<Item | null>();

      type NullableArray = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      };
      expectType<
        ResultUtils.Wrap<NullableArray>
      >().toStrictEqual<Array<Item> | null>();
    });

    it("Unwrap", () => {
      expectType<ResultUtils.Unwrap<Item>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      }>();
      // IsNullable variants:
      expectType<ResultUtils.Unwrap<Item | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<ResultUtils.Unwrap<Item | undefined>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<ResultUtils.Unwrap<Item | undefined | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      // IsArray variants:
      expectType<ResultUtils.Unwrap<Array<Item>>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      }>();
      expectType<ResultUtils.Unwrap<Array<Item> | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      }>();
    });
  });
});
