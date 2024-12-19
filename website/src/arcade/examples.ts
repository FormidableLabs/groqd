import datasets from "@site/src/datasets.json";
import beautify from "js-beautify";

const BASIC_IMPORTS = `
  import { runQuery } from "playground";
  import { q } from "groqd";
`.trim();

const wrapGroqBuilderQuery = (code: string) =>
  beautify(
    `
      import { runQuery } from "playground";
      import { q } from "playground/pokemon";
      
      runQuery(
        ${code.trim()}
      );
    `,
    { indent_size: 2, brace_style: "preserve-inline" }
  );

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
    code: wrapGroqBuilderQuery(`
      q.star
       .filterByType("pokemon")
       .slice(0, 8)
       .project(sub => ({
         name: q.string(),
         attack: sub.field("base.Attack", q.number()),
         types: sub.field("types[]").deref().project({
           name: q.string(),
         }),
       }))
    `),
  },
  "Basic Query (without validation)": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
       .filterByType("pokemon")
       .slice(0, 8)
       .project(sub => ({
         name: true,
         attack: "base.Attack",
         types: sub.field("types[]").deref().project({
           name: true,
         }),
       }))
    `),
  },
  "Using .deref() for joining related data": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
				.filterByType("pokemon")
				.slice(0, 8)
				.project(sub => ({
					name: q.string(),
					types: sub.field("types[]").deref().field("name", q.string()),
				}))
    `),
  },

  "Joining Related Data": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
        .filterByType("poketype")
        .project({
          name: q.string(),
          pokemons: q.star
            .filterByType("pokemon")
            .filter("references(^._id)")
            .slice(0, 2)
            .field("name", q.string())
        })
    `),
  },

  "Multiple root queries": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.project({
          numPokemon: q.raw("count(*[_type == 'pokemon'])", q.number()),
          allTypeNames: q.star.filterByType("poketype").field("name", q.string()),
        })
    `),
  },

  "Raw GROQ Functions": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
        .filterByType("pokemon")
        .slice(0, 8)
        .project({
          name: q.string(),
          // pass a raw query with a validation function
          count: q.raw("count(types)", q.number()),
          coalesce: q.raw("coalesce(foo, 'not there')", q.string()),
        })
    `),
  },

  "Conditional projections using 'select'": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
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
          // For all other pokemon, cast them into a custom "unsupported selection" type
          // while retaining useful information for run-time logging
          default: {
            _id: q.string(),
            name: q.value("unsupported pokemon", q.literal("unsupported pokemon")),
            unsupportedName: ["name", q.string()]
          }
        })
    `),
  },

  "Using the .score method": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      // Bubble Grass type pokemon to the top of the list.
      q.star
        .filterByType("pokemon")
        // score based on inclusion of grass type in pokemon's types.
        .score("'type.Grass' in types[]._ref")
        // then sort based on _score field
        .order("_score desc")
        .project(sub => ({
          name: q.string(),
          types: sub.field("types").filter().deref().field("name", q.string())
        }))
    `),
  },
} satisfies Record<string, ExamplePayload>;
