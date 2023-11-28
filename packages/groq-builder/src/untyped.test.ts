import { describe, it } from "vitest";
import { expectType } from "./tests/expectType";
import { InferResultType } from "./types/public-types";

import { q } from "./untyped";

describe("untyped", () => {
  it("filterByType", () => {
    const qFilterByType = q.star.filterByType("ANYTHING");
    expectType<
      InferResultType<typeof qFilterByType>
    >().toStrictEqual<Array<any> | null>();
  });
  it("filterBy", () => {
    const qFilterBy = q.star.filterBy('key == "value"');
    expectType<
      InferResultType<typeof qFilterBy>
    >().toStrictEqual<Array<any> | null>();
  });
  it("deref", () => {
    const qDeref = q.star.deref();
    expectType<
      InferResultType<typeof qDeref>
    >().toStrictEqual<Array<any> | null>();
  });
  it("order", () => {
    const qOrder = q.star.order("ANYTHING");
    expectType<InferResultType<typeof qOrder>>().toStrictEqual<Array<any>>();
  });
  it("projection", () => {
    // todo
  });
  it("slice(0)", () => {
    const qSlice = q.star.slice(0);
    expectType<InferResultType<typeof qSlice>>().toStrictEqual<any>();
    expectType<InferResultType<typeof qSlice>>().not.toStrictEqual<
      Array<any>
    >();
  });
  it("slice(10, 5)", () => {
    const qSlice = q.star.slice(10, 15);
    expectType<InferResultType<typeof qSlice>>().toStrictEqual<Array<any>>();
  });
  it("star", () => {
    const qStar = q.star;
    expectType<InferResultType<typeof qStar>>().toStrictEqual<Array<any>>();
  });
});
