import { describe, it } from "vitest";
import { q } from "./index";
import type { InferType, TypeFromSelection, Selection } from "./index";

describe("InferType", () => {
  it("can infer type from query", () => {
    const query = q("*")
      .filter("_type == 'pokemon'")
      .grab({ name: q.string() });

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

  it("can infer type from query schema", () => {
    const { schema } = q("*")
      .filter("_type == 'pokemon'")
      .grab({ name: q.string() });

    type Res = InferType<typeof schema>;

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

describe("TypeFromSelection", () => {
  it("can grab TS type from a selection object", () => {
    const textBlockSelection = {
      _type: q.literal("textBlock"),
      content: q.array(
        q.object({
          content: q.string().nullable(),
          textColor: q
            .union([q.literal("light"), q.literal("dark")])
            .nullable()
            .optional(),
        })
      ),
    } satisfies Selection;

    type Res = TypeFromSelection<typeof textBlockSelection>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res: Res = { _type: "textBlock", content: [] };

    // @ts-expect-error Expecting error, since _type is not of correct type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res2: Res = { _type: "foop", content: [] };

    // @ts-expect-error Expecting error, since content is missing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res3: Res = { _type: "textBlock" };
  });
});
