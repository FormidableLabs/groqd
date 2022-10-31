import { describe, it, expect } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import { z } from "zod";

describe("filter", () => {
  it("applies simple filter appropriately, returning unknown array", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"))
    );

    expect(query).toBe(`*[_type == 'pokemon']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    expect(Array.isArray(data) && "name" in data[0]).toBeTruthy();
  });

  it("can stack filters, with no projection, schema is still unknown", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q("*", q.filter("_type == 'pokemon'"), q.filter("name match 'char*'"))
    );

    expect(query).toBe(`*[_type == 'pokemon'][name match 'char*']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
    expect(data?.length).toBe(3);
  });

  it("can filter, project, and filter, and schema of projection is preserved", async () => {
    const { query, schema, data } = await runPokemonQuery(
      q(
        "*",
        q.filter("_type == 'pokemon'"),
        q.grab({
          name: q.string(),
        }),
        q.filter("name match 'char*'")
      )
    );

    expect(query).toBe(`*[_type == 'pokemon']{name}[name match 'char*']`);
    expect(schema instanceof z.ZodArray).toBeTruthy();
    expect(schema.element instanceof z.ZodObject).toBeTruthy();
    expect(data?.[0]?.name).toEqual("Charmander");
  });

  it("turns unknown schema into unknown array schema", async () => {
    const { schema: schema1 } = await runPokemonQuery(q(""));
    expect(schema1 instanceof z.ZodUnknown);

    const { schema: schema2 } = await runPokemonQuery(
      q("", q.filter("_type == 'animal'"))
    );
    expect(
      schema2 instanceof z.ZodArray && schema2.element instanceof z.ZodUnknown
    );
  });
});
