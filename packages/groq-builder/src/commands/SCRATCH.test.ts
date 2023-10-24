import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../../sanity-types";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();

describe("", () => {
  it("how to get the root star", () => {
    // Star:
    q.star().filterByType("flavour");
    q.star.filterByType("flavour");
    // Get:
    q.get("*").filterByType("flavour");
    q.query("*").filterByType("flavour");

    // Tricky:
    q("*").filterByType("flavour");
    q["*"].filterByType("flavour");
    q._.filterByType("flavour");
  });
  it("how to form multiple root queries", () => {
    // eg:
    `
      count(*[_type == 'flavour']) >= 5
    `;
    q.count(q.get("*").filterByType("flavour")).compare(">=", 5);
    q.count(q.get("*").filterByType("flavour")).compare(
      ">=",

      q.count(q.get("*").filterByType("color"))
    );

    q.compare(q.count("*"), ">=", q.count("*"));

    // Grab:
    q.projection({
      flavours: q.field("*").filterByType("flavour"),
    });

    // Get:
    q.get({
      flavours: q.field("*").filterByType("flavour"),
    });
  });

  const all = q.field("*");
  all.filterBy("");
});
