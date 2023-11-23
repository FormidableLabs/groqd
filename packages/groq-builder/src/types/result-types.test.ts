import { describe, it } from "vitest";
import { expectType } from "../tests/expectType";
import {
  ResultItem,
  ResultItemMaybe,
  ResultOverride,
  ResultTypeInfer,
  ResultTypeOutput,
} from "./result-types";

describe("result-types", () => {
  type Item = { ITEM: "ITEM" };

  it("ResultOverride", () => {
    expectType<ResultOverride<Array<Item>, "NEW-ITEM">>().toStrictEqual<
      Array<"NEW-ITEM">
    >();
    expectType<
      ResultOverride<Array<Item> | null, "NEW-ITEM">
    >().toStrictEqual<Array<"NEW-ITEM"> | null>();
  });

  it("ResultItem", () => {
    expectType<ResultItem<Array<Item>>>().toStrictEqual<Item>();
    expectType<ResultItem<Array<Item> | null>>().toStrictEqual<Item>();
  });
  it("ResultItemMaybe", () => {
    expectType<ResultItemMaybe<Array<Item>>>().toStrictEqual<Item>();
    expectType<
      ResultItemMaybe<Array<Item> | null>
    >().toStrictEqual<Item | null>();
  });

  describe("internal types", () => {
    it("ResultTypeOutput", () => {
      type ArrayResult = {
        TItem: Item;
        IsArray: true;
        IsNullable: false;
      };
      expectType<ResultTypeOutput<ArrayResult>>().toStrictEqual<Array<Item>>();

      type SingleItem = {
        TItem: Item;
        IsArray: false;
        IsNullable: false;
      };
      expectType<ResultTypeOutput<SingleItem>>().toStrictEqual<Item>();

      type NullableItem = {
        TItem: Item;
        IsArray: false;
        IsNullable: true;
      };
      expectType<ResultTypeOutput<NullableItem>>().not.toStrictEqual<Item>();
      expectType<ResultTypeOutput<NullableItem>>().toStrictEqual<Item | null>();

      type NullableArray = {
        TItem: Item;
        IsArray: true;
        IsNullable: true;
      };
      expectType<
        ResultTypeOutput<NullableArray>
      >().toStrictEqual<Array<Item> | null>();
    });

    it("ResultTypeInfer", () => {
      expectType<ResultTypeInfer<Item>>().toStrictEqual<{
        TItem: Item;
        IsArray: false;
        IsNullable: false;
      }>();
      // IsNullable variants:
      expectType<ResultTypeInfer<Item | null>>().toStrictEqual<{
        TItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<ResultTypeInfer<Item | undefined>>().toStrictEqual<{
        TItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<ResultTypeInfer<Item | undefined | null>>().toStrictEqual<{
        TItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      // IsArray variants:
      expectType<ResultTypeInfer<Array<Item>>>().toStrictEqual<{
        TItem: Item;
        IsArray: true;
        IsNullable: false;
      }>();
      expectType<ResultTypeInfer<Array<Item> | null>>().toStrictEqual<{
        TItem: Item;
        IsArray: true;
        IsNullable: true;
      }>();
    });
  });
});
