import { describe, expectTypeOf, it } from "vitest";
import { Combine } from "./union-to-intersection";

describe("Combine", () => {
  type A = {
    _type: "A";
    a: "A";
  };
  type B = {
    _type: "B";
    b: "B";
  };
  type C = {
    _type: "C";
    b?: "C";
    c?: "C";
  };
  it("should do nothing with just a single element", () => {
    expectTypeOf<Combine<A>>().toEqualTypeOf<A>();
  });
  it("should combine all properties", () => {
    type Combined = Combine<A | B>;
    expectTypeOf<Combined>().toEqualTypeOf<{
      _type: "A" | "B";
      a?: "A";
      b?: "B";
    }>();
  });
  it("should combine all properties", () => {
    type Combined = Combine<A | B | C>;
    expectTypeOf<Combined>().toEqualTypeOf<{
      _type: "A" | "B" | "C";
      a?: "A";
      b?: "B" | "C";
      c?: "C";
    }>();
  });
});
