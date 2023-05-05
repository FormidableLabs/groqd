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

  "Forking Selection": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      q("*")
        .filterByType("pokemon")
        .filter("name in ['Bulbasaur', 'Charmander']")
        .select({
          // For Bulbasaur, grab the HP
          'name == "Bulbasaur"': {
            _id: q.string(),
            name: q.literal("Bulbasaur"),
            hp: ["base.HP", q.number()],
          },
          // For Charmander, grab the Attack
          'name == "Charmander"': {
            _id: q.string(),
            name: q.literal("Charmander"),
            attack: ["base.Attack", q.number()],
          },
          // For all other pokemon, cast them into an unsupported selection
          // while retaining useful information for run-time logging
          default: {
            _id: q.string(),
            name: ['"unsupported pokemon"', q.literal("unsupported pokemon")],
            unsupportedName: ['name', q.string()]
          }
        })
    `),
  },

  "Using the .score method": {
    dataset: "pokemon",
    code: wrapStandardQuery(`
      // Bubble Grass type pokemon to the top of the list.
      q("*")
        .filterByType("pokemon")
        // score based on inclusion of grass type in pokemon's types.
        .score("'type.Grass' in types[]._ref")
        // then sort based on _score field
        .order("_score desc")
        .grab({
          name: q.string(),
          types: q("types").filter().deref().grabOne("name", q.string())
        })
    `),
  },
} satisfies Record<string, ExamplePayload>;
