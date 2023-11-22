import { describe, it } from "vitest";
import {
  ResultOverrideArray,
  ResultOverrideItem,
  ResultType,
  ResultTypeInfer,
  ResultTypeOutput,
} from "./result-types";
import { expectType } from "../tests/expectType";

describe("ResultType", () => {
  type Item = { ITEM: "ITEM" };

  it("ResultOverride", () => {
    type ItemsArray = Array<Item>;

    expectType<
      ResultOverrideItem<ItemsArray, { TItem: "NEW-ITEM" }>
    >().toStrictEqual<Array<"NEW-ITEM">>();

    expectType<
      ResultOverrideArray<ItemsArray, { IsArray: false }>
    >().toStrictEqual<Item>();
  });

  it("ResultTypeOutput", () => {
    type ArrayResult = ResultType<{
      TItem: Item;
      IsArray: true;
      IsNullable: false;
    }>;
    expectType<ResultTypeOutput<ArrayResult>>().toStrictEqual<Array<Item>>();

    type SingleItem = ResultType<{
      TItem: Item;
      IsArray: false;
      IsNullable: false;
    }>;
    expectType<ResultTypeOutput<SingleItem>>().toStrictEqual<Item>();

    type NullableItem = ResultType<{
      TItem: Item;
      IsArray: false;
      IsNullable: true;
    }>;
    expectType<ResultTypeOutput<NullableItem>>().not.toStrictEqual<Item>();
    expectType<ResultTypeOutput<NullableItem>>().toStrictEqual<Item | null>();

    type NullableArray = ResultType<{
      TItem: Item;
      IsArray: true;
      IsNullable: true;
    }>;
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
