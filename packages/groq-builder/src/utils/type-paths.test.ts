import { describe, it } from "vitest";
import { Path, PathValue, PathEntries } from "./type-paths";
import { expectType } from "../tests/expectType";

describe("type-paths", () => {
  type TestObject = {
    a: "A";
    b: { c: "C" };
    d: { e: { f: 0 } };
    g: {};
    h: [];
    i: Array<{ j: "J" }>;
  };

  it("'Path' should extract all object keys", () => {
    expectType<Path<TestObject>>().toStrictEqual<
      | "a"
      //
      | "b"
      | "b.c"
      | "d"
      | "d.e"
      | "d.e.f"
      | "g"
      | "h"
      | "i"
    >();
  });

  it("'PathValue' should extract the correct values", () => {
    expectType<PathValue<TestObject, "a">>().toStrictEqual<"A">();
    expectType<PathValue<TestObject, "b">>().toStrictEqual<{ c: "C" }>();
    expectType<PathValue<TestObject, "b.c">>().toStrictEqual<"C">();
    expectType<PathValue<TestObject, "d.e.f">>().toStrictEqual<0>();
  });

  it("'PathEntries' should extract all entries", () => {
    expectType<PathEntries<TestObject>>().toStrictEqual<
      | ["a", "A"]
      | ["b", { c: "C" }]
      | ["b.c", "C"]
      | ["d", { e: { f: 0 } }]
      | ["d.e", { f: 0 }]
      | ["d.e.f", 0]
      | ["g", {}]
      | ["h", []]
      | ["i", Array<{ j: "J" }>]
    >();
  });
});
