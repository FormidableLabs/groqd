import { describe, expect, it } from "vitest";
import { oldAll, q } from ".";
import { z } from "zod";

// describe("filter", () => {
// 	it("applies a simple filter", () => {
// 		expect(oldAll().filter("_type == 'animal'").query).toBe(
// 			`*[_type == 'animal']`
// 		);
// 	});

// 	it("applies stacked filters", () => {
// 		expect(
// 			oldAll().filter("_type == 'animal'").filter("breed == 'dog'").query
// 		).toBe(`*[_type == 'animal'][breed == 'dog']`);
// 	});
// });

// describe("sort", () => {
// 	it("applies a simple order", () => {
// 		expect(oldAll().order("name asc").query).toBe("*|order(name asc)");
// 	});

// 	it("stacks a sort on top of filter", () => {
// 		expect(oldAll().filter("_type == 'animal'").order("name asc").query).toBe(
// 			`*[_type == 'animal']|order(name asc)`
// 		);
// 	});
// });

// describe("slice", () => {
// 	it("applies a simple slice", () => {
// 		expect(oldAll().slice(0).query).toBe(`*[0]`);
// 		expect(oldAll().slice(0, 3).query).toBe(`*[0..3]`);
// 	});
// });

describe("q", () => {
	it("can pipe some stuff", () => {
		expect(
			q(q.all(), q.filter("_type == 'animal'"), q.select({ name: true })).query
		).toBe(`*[_type == 'animal']`);
	});

	it("can filter then sort", () => {
		console.log("Yeah?", z.number() instanceof z.ZodArray);

		expect(
			q(
				q.all(),
				q.filter("_type == 'animal'"),
				q.select({ name: q.string("name") }),
				q.order("name asc")
			).query
		).toBe(`*[_type == 'animal']|order(name asc)`);
	});
});
