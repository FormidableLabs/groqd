import { describe, expect, it } from "vitest";
import { q, QueryResult } from ".";
import { z } from "zod";
import { evaluate, parse } from "groq-js";

describe("q", () => {
  it.skip("foo", () => {});
});

// describe("q", () => {
//   it("handles `query('')` as an empty query with unknown result", () => {
//     const { query, schema } = q("");
//
//     expect(query).toBe("");
//     expect(schema instanceof z.ZodUnknown).toBeTruthy();
//   });
//
//   // it("handles `*` as array of unknown", () => {
//   //   const { query, schema } = q(q.all());
//   //
//   //   expect(query).toBe("*");
//   //   expect(schema instanceof z.ZodArray).toBeTruthy();
//   //   expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
//   //   expect(schema.parse([])).toEqual([]);
//   // });
//   //
//   it("handles empty filter, unknown array schema", () => {
//     const { query, schema } = q("*", q.filter("_type == 'animal'"));
//
//     expect(query).toBe("*[_type == 'animal']");
//     expect(schema instanceof z.ZodArray).toBeTruthy();
//     expect(schema.element instanceof z.ZodUnknown).toBeTruthy();
//   });
//   //
//   // // TODO: Ordering
//   //
//   it("can select values (one level)", () => {
//     const { query, schema } = q(
//       "*",
//       q.filter("_type == 'animal'"),
//       q.grab({ name: q.string(), age: q.number() })
//     );
//
//     expect(query).toEqual(`*[_type == 'animal']{name, age}`);
//     expect(schema instanceof z.ZodArray).toBeTruthy();
//     expect(schema.parse([{ name: "Rudy", age: 32 }])).toEqual([
//       { name: "Rudy", age: 32 },
//     ]);
//
//     expect(() => {
//       schema.parse([{ foo: "bar" }]);
//     }).toThrow();
//   });
//
//   it("can select values (two levels)", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({ name: q.string(), age: q.number() }),
//       q.grab({ name: q.string() })
//     );
//
//     expect(query).toEqual(`*{name, age}{name}`);
//     expect(schema instanceof z.ZodArray).toBeTruthy();
//     expect(schema.parse([{ name: "Rudy" }])).toEqual([{ name: "Rudy" }]);
//
//     expect(() => {
//       schema.parse([{ foo: "bar" }]);
//     }).toThrow();
//   });
//
//   it("can select values from empty object", () => {
//     const { query, schema } = q(
//       "",
//       q.grab({
//         name: q.string(),
//       })
//     );
//
//     expect(query).toBe("{name}");
//     expect(schema instanceof z.ZodObject).toBeTruthy();
//     expect(schema.parse({ name: "Rudy" })).toEqual({ name: "Rudy" });
//   });
//
//   it("can select with sub-queries/joins", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({
//         name: q.string(),
//         owners: q(
//           "*",
//           q.filter("_type == 'owner' && references(^._id)"),
//           q.grab({ age: q.number() }),
//           q.slice(0, 3)
//         ),
//       }),
//       q.slice(0)
//     );
//
//     expect(trimmed(query)).toBe(
//       trimmed(
//         `*{name,"owners":*[_type == 'owner' && references(^._id)]{age}[0..3]}[0]`
//       )
//     );
//   });
//
//   it("can select with a rename", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({
//         name: ["firstname", q.string()],
//       }),
//       q.slice(0)
//     );
//
//     expect(query).toBe(`*{"name": firstname}[0]`);
//     expect(schema.parse({ name: "Rudy" })).toEqual({ name: "Rudy" });
//   });
//
//   it("can select with an expression", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({
//         name: ["firstname + lastname", q.string()],
//       }),
//       q.slice(0)
//     );
//
//     expect(query).toBe(`*{"name": firstname + lastname}[0]`);
//     expect(schema.parse({ name: "Rudy Judy" })).toEqual({ name: "Rudy Judy" });
//   });
//
//   it("can slice values", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({ name: q.string() }),
//       q.slice(0, 1)
//     );
//
//     expect(query).toBe("*{name}[0..1]");
//     expect(schema instanceof z.ZodArray).toBeTruthy();
//     expect(schema.element instanceof z.ZodObject).toBeTruthy();
//   });
//
//   it("can slice a single value out", () => {
//     const { query, schema } = q(
//       "*",
//       q.grab({
//         name: q.string().optional(),
//       }),
//       q.slice(0)
//     );
//
//     expect(query).toBe("*{name}[0]");
//     expect(schema instanceof z.ZodObject);
//     expect(schema.parse({ name: "Rudy" })).toEqual({ name: "Rudy" });
//   });
//
//   it("handles naked projection", () => {
//     const { query, schema } = q(
//       "*",
//       q.filter("_type == 'owner'"),
//       q.grab({
//         pets: q("pets", q.filter(), q.deref(), q.grabOne("name", q.string())),
//       })
//     );
//
//     expect(query).toBe(`*[_type == 'owner']{"pets": pets[]->.name}`);
//   });
//
//   it.skip("testing thing", async () => {
//     const { query, schema } = q(
//       "*",
//       q.filter("_type == 'animal'"),
//       q.grab({
//         name: q.string(),
//         owner: q(
//           "*",
//           q.filter("_type=='owner' && references(^._id)"),
//           q.grab({ name: q.string() }),
//           q.slice(0)
//         ),
//       })
//     );
//
//     const tree = parse(query);
//     const res = await evaluate(tree, { dataset });
//     console.log("data!", JSON.stringify(await res.get(), null, 2));
//   });
//
//   it.skip("runs query, can deref", async () => {
//     const res = await runQuery(
//       q(
//         "*",
//         q.filter("_type == 'owner'"),
//         q.grab({
//           name: q.string(),
//           pets: q("pets", q.filter(), q.deref(), q.grab({ name: q.string() })),
//         })
//       )
//     );
//
//     // TODO: Test for this
//   });
//
//   it.only("test...", async () => {
//     const res = await runQuery(
//       q(
//         "",
//         q.grab({ count: ["count(*[_type == 'animal'])", q.number()] }),
//         q.grabOne("count", q.number())
//       )
//     );
//
//     console.log("RES!!!", res);
//   });
// });
//
// const trimmed = (str: string) => str.replace(/ /g, "");
//
// const runQuery = async <T extends z.ZodType>(
//   q: QueryResult<T>
// ): Promise<z.infer<T>> => {
//   const tree = parse(q.query);
//   const _ = await evaluate(tree, { dataset });
//   const rawRes = await _.get();
//
//   return q.schema.parse(rawRes);
// };
//
// const dataset = [
//   {
//     _type: "animal",
//     name: "Remy",
//     _id: "614b6d9b-75ca-4769-b9ca-06048fb47a3f",
//   },
//   { _type: "animal", name: "Rogue", _id: "asbasdf" },
//   {
//     _type: "owner",
//     name: "Grant",
//     pets: [
//       {
//         _key: "e6e54f0e0770",
//         _ref: "614b6d9b-75ca-4769-b9ca-06048fb47a3f",
//         _type: "reference",
//       },
//     ],
//   },
// ];
