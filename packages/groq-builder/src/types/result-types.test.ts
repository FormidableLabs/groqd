import { describe, it } from "vitest";
import {
  ResultOverride,
  ResultType,
  ResultTypeInfer,
  ResultTypeOutput,
} from "./result-types";
import { expectType } from "../tests/expectType";

describe("ResultType", () => {
  type Item = { ITEM: "ITEM" };
  type ArrayResult = ResultType<{
    TItem: Item;
    IsArray: true;
    IsNullable: false;
  }>;
  type SingleItem = ResultType<{
    TItem: Item;
    IsArray: false;
    IsNullable: false;
  }>;
  type NullableItem = ResultType<{
    TItem: Item;
    IsArray: false;
    IsNullable: true;
  }>;
  type NullableArray = ResultType<{
    TItem: Item;
    IsArray: true;
    IsNullable: true;
  }>;

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

  it("ResultTypeOutput", () => {
    expectType<ResultTypeOutput<ArrayResult>>().toStrictEqual<Array<Item>>();

    expectType<ResultTypeOutput<SingleItem>>().toStrictEqual<Item>();

    expectType<ResultTypeOutput<NullableItem>>().not.toStrictEqual<Item>();
    expectType<ResultTypeOutput<NullableItem>>().toStrictEqual<Item | null>();

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
