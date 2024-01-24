import { describe, it } from "vitest";
import { expectType } from "../tests/expectType";
import {
  InferResultItem,
  InferResultItemMaybe,
  OverrideResultItem,
  InferResultDetails,
  InferFromResultDetails,
} from "./result-types";

describe("result-types", () => {
  type Item = { ITEM: "ITEM" };

  it("OverrideResultItem", () => {
    expectType<OverrideResultItem<Array<Item>, "NEW-ITEM">>().toStrictEqual<
      Array<"NEW-ITEM">
    >();
    expectType<
      OverrideResultItem<Array<Item> | null, "NEW-ITEM">
    >().toStrictEqual<Array<"NEW-ITEM"> | null>();
  });

  it("InferResultItem", () => {
    expectType<InferResultItem<Array<Item>>>().toStrictEqual<Item>();
    expectType<InferResultItem<Array<Item> | null>>().toStrictEqual<Item>();
  });
  it("InferResultItemMaybe", () => {
    expectType<InferResultItemMaybe<Array<Item>>>().toStrictEqual<Item>();
    expectType<
      InferResultItemMaybe<Array<Item> | null>
    >().toStrictEqual<Item | null>();
  });

  describe("internal types", () => {
    it("InferFromResultDetails", () => {
      type ArrayResult = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      };
      expectType<InferFromResultDetails<ArrayResult>>().toStrictEqual<
        Array<Item>
      >();

      type SingleItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      };
      expectType<InferFromResultDetails<SingleItem>>().toStrictEqual<Item>();

      type NullableItem = {
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      };
      expectType<
        InferFromResultDetails<NullableItem>
      >().not.toStrictEqual<Item>();
      expectType<
        InferFromResultDetails<NullableItem>
      >().toStrictEqual<Item | null>();

      type NullableArray = {
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      };
      expectType<
        InferFromResultDetails<NullableArray>
      >().toStrictEqual<Array<Item> | null>();
    });

    it("InferResultDetails", () => {
      expectType<InferResultDetails<Item>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: false;
      }>();
      // IsNullable variants:
      expectType<InferResultDetails<Item | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<InferResultDetails<Item | undefined>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      expectType<InferResultDetails<Item | undefined | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: false;
        IsNullable: true;
      }>();
      // IsArray variants:
      expectType<InferResultDetails<Array<Item>>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: false;
      }>();
      expectType<InferResultDetails<Array<Item> | null>>().toStrictEqual<{
        TResultItem: Item;
        IsArray: true;
        IsNullable: true;
      }>();
    });
  });
});
