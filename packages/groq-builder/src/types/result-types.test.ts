import { describe, it } from "vitest";
import { ResultOverride, ResultType, ResultTypeInfer } from "./result-types";
import { expectType } from "../tests/expectType";

describe("ResultType", () => {
  type Item = { ITEM: "ITEM" };
  type ArrayResult = ResultType<Item, true, false>;

  it("ResultType types", () => {
    expectType<ArrayResult>().toStrictEqual<{
      TItem: Item;
      IsArray: true;
      IsNullable: false;
    }>();
  });

  it("ResultOverride", () => {
    expectType<
      ResultOverride<ArrayResult, { TItem: "NEW-ITEM" }>
    >().toStrictEqual<{
      TItem: "NEW-ITEM";
      IsArray: true;
      IsNullable: false;
    }>();

    expectType<
      ResultOverride<ArrayResult, { IsArray: false }>
    >().toStrictEqual<{
      TItem: Item;
      IsArray: false;
      IsNullable: false;
    }>();

    expectType<
      ResultOverride<ArrayResult, { IsNullable: true }>
    >().toStrictEqual<{
      TItem: Item;
      IsArray: true;
      IsNullable: true;
    }>();
  });

  it("ResultTypeInfer", () => {
    expectType<ResultTypeInfer<ArrayResult>>().toStrictEqual<Array<Item>>();

    type SingleItem = ResultType<Item, false, false>;
    expectType<ResultTypeInfer<SingleItem>>().toStrictEqual<Item>();

    type NullableItem = ResultType<Item, false, true>;
    expectType<ResultTypeInfer<NullableItem>>().not.toStrictEqual<Item>();
    expectType<ResultTypeInfer<NullableItem>>().toStrictEqual<Item | null>();

    type NullableArray = ResultType<Item, true, true>;
    expectType<
      ResultTypeInfer<NullableArray>
    >().toStrictEqual<Array<Item> | null>();
  });
});
