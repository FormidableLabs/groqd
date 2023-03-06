import { describe, expect, expectTypeOf, it } from "vitest";
import { runUserQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("contentBlock", () => {
  it("can handle content blocks", async () => {
    const { data, query } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .slice(0)
        .grab({
          name: q.string(),
          bio: q.array(q.contentBlock()),
        })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
  });

  it("allows for custom markDefs", async () => {
    const { data, query } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .slice(0)
        .grab({
          name: q.string(),
          bio: q.array(
            q.contentBlock({
              markDefs: q.union([
                q.object({ _type: q.literal("link"), href: q.string() }),
                q.object({ _type: q.literal("note"), note: q.string() }),
              ]),
            })
          ),
        })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expectTypeOf(data.bio[0].markDefs)
      .exclude(undefined)
      .toEqualTypeOf<
        ({ _type: "link"; href: string } | { _type: "note"; note: string })[]
      >();
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
    expect(data.bio[0].markDefs).toEqual([
      { _type: "link", href: "https://google.com" },
    ]);
  });
});

describe("contentBlocks", () => {
  it("can handle content blocks", async () => {
    const { data, query } = await runUserQuery(
      q("*").filter("_type == 'user'").slice(0).grab({
        name: q.string(),
        bio: q.contentBlocks(),
      })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
  });

  it("allows for custom markDefs", async () => {
    const { data, query } = await runUserQuery(
      q("*")
        .filter("_type == 'user'")
        .slice(0)
        .grab({
          name: q.string(),
          bio: q.contentBlocks({
            markDefs: q.union([
              q.object({ _type: q.literal("link"), href: q.string() }),
              q.object({ _type: q.literal("note"), note: q.string() }),
            ]),
          }),
        })
    );

    expect(query).toBe(`*[_type == 'user'][0]{name, bio}`);
    invariant(data);
    expectTypeOf(data.bio[0].markDefs)
      .exclude(undefined)
      .toEqualTypeOf<
        ({ _type: "link"; href: string } | { _type: "note"; note: string })[]
      >();
    expect(Array.isArray(data.bio)).toBeTruthy();
    expect(data.bio[0]._type === "block").toBeTruthy();
    expect(data.bio[0].markDefs).toEqual([
      { _type: "link", href: "https://google.com" },
    ]);
  });
});
