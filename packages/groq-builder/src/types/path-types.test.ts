import { describe, it } from "vitest";
import { Path, PathValue, PathEntries } from "./path-types";
import { expectType } from "../tests/expectType";
import { DeepRequired } from "./deep-required";

describe("type-paths", () => {
  type TestObject = {
    a: "A";
    b: { c: "C" };
    d: { e: { f: 0 } };
    g: {};
    h: [];
    i: Array<{ j: "J" }>;
    j?: { k?: "K" };
  };

  describe("'Path'", () => {
    type Keys = Path<TestObject>;
    it("should extract all object keys", () => {
      expectType<Keys>().toStrictEqual<
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
        | "j"
      >();
    });
    it("optional values don't get included", () => {
      type KeysRequired = Path<DeepRequired<TestObject>>;
      expectType<Exclude<KeysRequired, Keys>>().toStrictEqual<"j.k">();
    });
  });

  describe("'PathValue'", () => {
    it("should extract the correct values", () => {
      expectType<PathValue<TestObject, "a">>().toStrictEqual<"A">();
      expectType<PathValue<TestObject, "b">>().toStrictEqual<{ c: "C" }>();
      expectType<PathValue<TestObject, "b.c">>().toStrictEqual<"C">();
      expectType<PathValue<TestObject, "d.e.f">>().toStrictEqual<0>();
    });
  });

  describe("'PathEntries'", () => {
    it("should extract all entries", () => {
      type Entries = PathEntries<TestObject>;
      expectType<Entries>().toStrictEqual<
        | ["a", "A"]
        | ["b", { c: "C" }]
        | ["b.c", "C"]
        | ["d", { e: { f: 0 } }]
        | ["d.e", { f: 0 }]
        | ["d.e.f", 0]
        | ["g", {}]
        | ["h", []]
        | ["i", Array<{ j: "J" }>]
        | ["j", undefined | { k?: "K" }]
      >();
    });
  });
});
