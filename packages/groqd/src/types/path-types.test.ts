import { describe, expectTypeOf, it } from "vitest";
import { Path, PathValue, PathEntries } from "./path-types";
import { DeepRequired } from "./deep-required";

describe("type-paths", () => {
  type TestObject = {
    a: "A";
    b: { c: "C" };
    d: { e: { f: 0 } };
    g: {};
    h: [];
    i: Array<{ j: "J" }>;
    j?: { k: "K" };
    l?: "L";
  };

  describe("'Path'", () => {
    type Keys = Path<TestObject>;
    it("should extract all object keys", () => {
      expectTypeOf<Keys>().toEqualTypeOf<
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
        | "l"
      >();
    });
    it("deeply optional values don't get included", () => {
      type KeysRequired = Path<DeepRequired<TestObject>>;
      expectTypeOf<Exclude<KeysRequired, Keys>>().toEqualTypeOf<"j.k">();
    });
  });

  describe("'PathValue'", () => {
    it("should extract the correct values", () => {
      expectTypeOf<PathValue<TestObject, "a">>().toEqualTypeOf<"A">();
      expectTypeOf<PathValue<TestObject, "b">>().toEqualTypeOf<{ c: "C" }>();
      expectTypeOf<PathValue<TestObject, "b.c">>().toEqualTypeOf<"C">();
      expectTypeOf<PathValue<TestObject, "d.e.f">>().toEqualTypeOf<0>();
    });
  });

  describe("'PathEntries'", () => {
    it("should extract all entries", () => {
      type Entries = PathEntries<TestObject>;
      expectTypeOf<Entries>().toEqualTypeOf<{
        a: "A";
        b: { c: "C" };
        "b.c": "C";
        d: { e: { f: 0 } };
        "d.e": { f: 0 };
        "d.e.f": 0;
        g: {};
        h: [];
        i: Array<{ j: "J" }>;
        j: undefined | { k: "K" };
        l: "L" | undefined;
      }>();
    });
  });
});
