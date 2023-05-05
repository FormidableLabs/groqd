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

  "Multiple root queries": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("")
        .grab({
          numPokemon: ["count(*[_type == 'pokemon'])", q.number()],
          allTypeNames: q("*").filterByType("poketype").grabOne("name", q.string()),
        })
    `),
  },

  "Raw GROQ Functions": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("*")
        .filterByType("pokemon")
        .slice(0, 8)
        .grab({
          name: q.string(),
          // pass raw query and a schema 
          numTypes: ["count(types)", q.number()],
          foo: ["coalesce(foo, 'not there')", q.string()]
        })
    `),
  },
} satisfies Record<string, ExamplePayload>;
