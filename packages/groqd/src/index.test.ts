import { describe, expect, it } from "vitest";

import * as root from "./index";

describe("root exports", () => {
  it("should have proper exports", () => {
    expect(typeof root.createGroqBuilderWithZod).toBe("function");
    expect(typeof root.createGroqBuilderLite).toBe("function");
    expect(typeof root.createGroqBuilder).toBe("function");
    root.z.string();
    root.zod.string();
  });
});
