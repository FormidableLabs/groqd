import { describe, it, expect } from "vitest";
import { pipe } from "./builder";

describe("builder", () => {
  it("tests", () => {
    const { schema, query } = pipe("*").filter("_type == 'Pokemon'").value();
    expect(query).toBe("*[_type == 'Pokemon']");
  });
});
