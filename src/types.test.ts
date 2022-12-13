import { describe, it } from "vitest";
import { q } from "./index";
import type { InferType } from "./types";

describe("InferType", () => {
  it("can infer type from query", () => {
    const query = q(
      "*",
      q.filter("_type == 'pokemon'"),
      q.grab({ name: q.string() })
    );

    type Res = InferType<typeof query>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res: Res = [{ name: "Bulbasaur" }];

    // @ts-expect-error Expecting error, since name is not of correct type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res2: Res = [{ name: 3 }];

    // @ts-expect-error Expecting error, unknown field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res3: Res = [{ age: 30 }];
  });
});
