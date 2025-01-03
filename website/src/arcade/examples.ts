import datasets from "@site/src/datasets.json";
import beautify from "js-beautify";

const wrapQueryTodos = (code: string) =>
  beautify(
    `
      import { q, runQuery } from "./todo-list/groqd-client";
      
      runQuery(
        ${code.trim()}
      );
    `,
    { indent_size: 2, brace_style: "preserve-inline" }
  );
const wrapGroqBuilderQuery = (code: string) =>
  beautify(
    `
      import { q, runQuery } from "./pokemon/groqd-client";
      
      runQuery(
        ${code.trim()}
      );
    `,
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

  "Conditional projections": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
        .filterByType("pokemon")
        .filter("name in ['Bulbasaur', 'Charmander']")
        .project(sub => ({
          _id: q.string(),
          ...sub.conditional({
            // For Bulbasaur, grab the HP
            'name == "Bulbasaur"': {
              name: q.literal("Bulbasaur"),
              hp: ["base.HP", q.number()],
            },
            // For Charmander, grab the Attack
            'name == "Charmander"': {
              name: q.literal("Charmander"),
              attack: ["base.Attack", q.number()],
            },
          }),
        }))
    `),
  },

  /*
  // TODO: Add support for `.score` method
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
   */
} satisfies Record<string, ExamplePayload>;
export const EXAMPLES_TODOS = {
  "Basic Query": {
    dataset: "todo-list",
    code: wrapQueryTodos(`
      q.star
       .filterByType("todo")
       .project(sub => ({
         user: sub.field("user").deref().field("name", q.string()),
         title: q.string(),
         completed: q.boolean(),
       }))
    `),
  },
  "Basic Query with VALIDATION ERRORS": {
    dataset: "todo-list-draft",
    code: wrapQueryTodos(`
      q.star
       .filterByType("todo")
       .project(sub => ({
         user: sub.field("user").deref().field("name", q.string()),
         title: q.string(),
         completed: q.boolean(),
       }))
    `),
  },
  "Basic Query with fixed validation errors": {
    dataset: "todo-list-draft",
    code: wrapQueryTodos(`
      q.star
       .filterByType("todo")
       .project(sub => ({
         user: sub.field("user").deref().field("name", q.default(q.string(), "")),
         title: q.default(q.string(), ""),
         completed: q.default(q.boolean().or(q.number().transform(x => x > 0)), false),
         completedRaw: "completed",
       }))
    `),
  },
} satisfies Record<string, ExamplePayload>;
