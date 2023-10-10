import { createGroqBuilder } from "../groq-builder";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";

const q = createGroqBuilder<SchemaConfig>();

describe("filter", () => {
  it("", () => {
    const res = q.filter();
    expectType<typeof res>().toStrictEqual<typeof q>();
    expect(q).toMatchObject({
      query: `[]`,
    });
  });
  it("", () => {
    const res = q.filter(`_type == 'flavour'`);
    expectType<typeof res>().toStrictEqual<typeof q>();
    expect(q).toMatchObject({
      query: `[_type == 'flavour']`,
    });
  });
});

describe("filterByType", () => {
  it("", () => {
    const res = q.star.filterByType("flavour");
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<SanitySchema["flavour"]>
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'flavour']`,
    });
  });
});
