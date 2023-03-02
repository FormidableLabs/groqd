import { q } from "./index";
import { z } from "zod";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("q.select()", () => {
  it("creates query from {condition: selection} composition", () => {
    const { query, schema } = q.__experimental_select({
      "foo > 2": {
        bar: z.boolean(),
      },
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => { bar }, { baz })");
    expectTypeOf({} as z.infer<typeof schema>).toEqualTypeOf<
      { bar: boolean } | { baz: string }
    >();
  });

  it("creates query from {condition: q()} composition", () => {
    const { query, schema } = q.__experimental_select({
      "foo > 2": q("bar").grab({
        bar: z.boolean(),
      }),
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => bar{bar}, { baz })");
    expectTypeOf({} as z.infer<typeof schema>).toEqualTypeOf<
      { bar: boolean } | { baz: string }
    >();
  });

  it("creates query from {condition: [name, schema]} composition", () => {
    const { query, schema } = q.__experimental_select({
      "foo > 2": ["bar", q.boolean()],
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe("select(foo > 2 => bar, { baz })");
    expectTypeOf({} as z.infer<typeof schema>).toEqualTypeOf<
      boolean | { baz: string }
    >();
  });

  it("makes schema nullable when default condition omitted", () => {
    const { query, schema } = q.__experimental_select({
      "foo > 2": {
        bar: z.boolean(),
      },
    });

    expect(query).toBe("select(foo > 2 => { bar })");
    expectTypeOf({} as z.infer<typeof schema>).toEqualTypeOf<{
      bar: boolean;
    } | null>();
  });

  it("handles nested selects properly", () => {
    const nestedSelect = q.__experimental_select({
      'bar == "thing"': {
        b: q.string(),
      },
      default: {
        c: z.string(),
      },
    });

    const { query, schema } = q.__experimental_select({
      "foo > 2": nestedSelect,
      default: {
        baz: z.string(),
      },
    });

    expect(query).toBe(
      'select(foo > 2 => select(bar == "thing" => { b }, { c }), { baz })'
    );
    expectTypeOf({} as z.infer<typeof schema>).toEqualTypeOf<
      { b: string } | { c: string } | { baz: string }
    >();
  });
});

describe("EntityQuery.select()", () => {
  describe("with standalone select input", () => {
    it("updates query and handles nested object types", () => {
      const standaloneSelect = q.__experimental_select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").__experimental_select(standaloneSelect);

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => { bar }, { baz })}"
      );
      expectTypeOf({} as z.infer<typeof entityQuery.schema>).toEqualTypeOf<
        { bar: boolean } | { baz: string }
      >();
    });

    it("converts no default condition to empty object", () => {
      const standaloneSelect = q.__experimental_select({
        "foo > 2": {
          bar: z.boolean(),
        },
      });
      const entityQuery = q("foo").__experimental_select(standaloneSelect);

      expect(entityQuery.query).toBe("foo{...select(foo > 2 => { bar })}");
      expectTypeOf({} as z.infer<typeof entityQuery.schema>).toEqualTypeOf<
        { bar: boolean } | {}
      >();
    });

    it("converts primitives to empty object", () => {
      const standaloneSelect = q.__experimental_select({
        "foo > 2": ["bar", z.boolean()],
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").__experimental_select(standaloneSelect);

      expect(entityQuery.query).toBe("foo{...select(foo > 2 => bar, { baz })}");
      expectTypeOf({} as z.infer<typeof entityQuery.schema>).toEqualTypeOf<
        {} | { baz: string }
      >();
    });

    it("handles nested union types properly", () => {
      const nestedSelect = q.__experimental_select({
        "foo == 3": ["a", q.string()],
        default: {
          b: q.boolean(),
        },
      });

      const standaloneSelect = q.__experimental_select({
        "foo > 2": nestedSelect,
        default: {
          baz: z.string(),
        },
      });
      const entityQuery = q("foo").__experimental_select(standaloneSelect);

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => select(foo == 3 => a, { b }), { baz })}"
      );
      expectTypeOf({} as z.infer<typeof entityQuery.schema>).toEqualTypeOf<
        {} | { b: boolean } | { baz: string }
      >();
    });
  });

  describe("with {condition: Selection} input", () => {
    it("updates query and handles nested object types", () => {
      const entityQuery = q("foo").__experimental_select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });

      expect(entityQuery.query).toBe(
        "foo{...select(foo > 2 => { bar }, { baz })}"
      );
      expectTypeOf({} as z.infer<typeof entityQuery.schema>).toEqualTypeOf<
        { bar: boolean } | { baz: string }
      >();
    });
  });
});

describe("ArrayQuery.select()", () => {
  it("handles standalone select input", () => {
    const standaloneSelect = q.__experimental_select({
      "foo > 2": {
        bar: z.boolean(),
      },
      default: {
        baz: z.string(),
      },
    });
    const query = q("*").filter().__experimental_select(standaloneSelect);

    expect(query.query).toBe("*[]{...select(foo > 2 => { bar }, { baz })}");
    expectTypeOf({} as z.infer<typeof query.schema>).toEqualTypeOf<
      ({ bar: boolean } | { baz: string })[]
    >();
  });

  it("handles {condition: Selection} input", () => {
    const query = q("*")
      .filter()
      .__experimental_select({
        "foo > 2": {
          bar: z.boolean(),
        },
        default: {
          baz: z.string(),
        },
      });

    expect(query.query).toBe("*[]{...select(foo > 2 => { bar }, { baz })}");
    expectTypeOf({} as z.infer<typeof query.schema>).toEqualTypeOf<
      ({ bar: boolean } | { baz: string })[]
    >();
  });
});
