import { describe, expect, it } from "vitest";
import { q } from ".";
import { z } from "zod";

describe("q", () => {
  it("handles `empty` as an empty query with unknown result", () => {
    const { query, schema } = q(q.empty());

    expect(query).toBe("");
    expect(schema instanceof z.ZodUnknown).toBeTruthy();
  });

  it("handles `all` as array of unknown", () => {
    const { query, schema } = q(q.all());

    expect(query).toBe("*");
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    expect(schema.parse([])).toEqual([]);
  });

  it("handles empty filter, unknown array schema", () => {
    const { query, schema } = q(q.all(), q.filter("_type == 'animal'"));

    expect(query).toBe("*[_type == 'animal']");
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
  });

  // TODO: Ordering

  it("can select values (one level)", () => {
    const { query, schema } = q(
      q.all(),
      q.filter("_type == 'animal'"),
      q.select({ name: q.string("name"), age: q.number("age") })
    );

    expect(query).toEqual(`*[_type == 'animal']{name, age}`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.parse([{ name: "Rudy", age: 32 }])).toEqual([
      { name: "Rudy", age: 32 },
    ]);

    expect(() => {
      schema.parse([{ foo: "bar" }]);
    }).toThrow();
  });

  it("can select values (two levels)", () => {
    const { query, schema } = q(
      q.all(),
      q.select({ name: q.string("name"), age: q.number("age") }),
      q.select({ name: q.string("name") })
    );

    expect(query).toEqual(`*{name, age}{name}`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.parse([{ name: "Rudy" }])).toEqual([{ name: "Rudy" }]);

    expect(() => {
      schema.parse([{ foo: "bar" }]);
    }).toThrow();
  });

  it("can select values from empty object", () => {
    const { query, schema } = q(
      q.empty(),
      q.select({
        name: q.string("name"),
      })
    );

    expect(query).toBe("{name}");
    expect(schema instanceof z.ZodObject).toBeTruthy();
    expect(schema.parse({ name: "Rudy" })).toEqual({ name: "Rudy" });
  });

  it("can select with sub-queries/joins", () => {
    const { query, schema } = q(
      q.all(),
      q.select({
        name: q.string("name"),
        owners: q(
          q.all(),
          q.filter("_type == 'owner' && references(^._id)"),
          q.select({ age: q.number("age") }),
          q.slice(0, 3)
        ),
      }),
      q.slice(0)
    );

    expect(trimmed(query)).toBe(
      trimmed(
        `*{name,"owners":*[_type == 'owner' && references(^._id)]{age}[0..3]}[0]`
      )
    );
  });

  it("can slice values", () => {
    const { query, schema } = q(
      q.all(),
      q.select({ name: q.string("name") }),
      q.slice(0, 1)
    );

    expect(query).toBe("*{name}[0..1]");
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodObject).toBeTruthy();
  });

  it("can slice a single value out", () => {
    const { query, schema } = q(
      q.all(),
      q.select({ name: q.string("name") }),
      q.slice(0)
    );

    expect(query).toBe("*{name}[0]");
    expect(schema instanceof z.ZodObject);
    expect(schema.parse({ name: "Rudy" })).toEqual({ name: "Rudy" });
  });

  it("testing thing", () => {
    const s = z.string().default("hello");

    expect(s.parse(undefined)).toBe("hello");
  });
});

const trimmed = (str: string) => str.replace(/ /g, "");
