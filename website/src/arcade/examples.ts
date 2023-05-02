import datasets from "@site/src/datasets.json";
import beautify from "js-beautify";

const BASIC_IMPORTS = `
import { runQuery } from "playground";
import { q } from "groqd";
`.trim();

const wrapStandardQuery = (code: string) =>
  beautify(
    `${BASIC_IMPORTS}

runQuery(
  ${code.trim()}
);`,
    { indent_size: 2, brace_style: "preserve-inline" }
  );

export type ExamplePayload = {
  dataset: keyof typeof datasets;
  code: string;
  description?: string;
};

export const EXAMPLES = {
  "Basic Query": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("*")
        .filterByType("pokemon")
        .slice(0, 8)
        .grab({
          name: q.string(),
          attack: ["base.Attack", q.number()],
        })
    `),
  },

  "Deref Related Data": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("*")
				.filterByType("pokemon")
				.slice(0, 8)
				.grab({
					name: q.string(),
					types: q("types").filter().deref().grabOne("name", q.string()),
				})`),
  },

  "Joining Related Data": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("*")
        .filterByType("poketype")
        .grab({
          name: q.string(),
          pokemons: q("*")
            .filterByType("pokemon")
            .filter("references(^._id)")
            .slice(0, 2)
            .grabOne("name", q.string())
        })
    `),
  },
} satisfies Record<string, ExamplePayload>;
