import datasets from "@site/src/datasets.json";
import beautify from "js-beautify";

const wrapQueryTodos = (code: string) =>
  beautify(
    `
      import { q, z, runQuery } from "./todo-list/groqd-client";
      
      runQuery(
        ${code.trim()}
      );
    `,
    { indent_size: 2, brace_style: "preserve-inline" }
  );
const wrapGroqBuilderQuery = (code: string) =>
  beautify(
    `
      import { q, z, runQuery } from "./pokemon/groqd-client";
      
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
         name: z.string(),
         attack: sub.field("base.Attack", z.number()),
         types: sub.field("types[]").deref().project({
           name: z.string(),
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
					name: z.string(),
					types: sub.field("types[]").deref().field("name", z.string()),
				}))
    `),
  },

  "Joining Related Data": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.star
        .filterByType("poketype")
        .project({
          name: z.string(),
          pokemons: q.star
            .filterByType("pokemon")
            .filter("references(^._id)")
            .slice(0, 2)
            .field("name", z.string())
        })
    `),
  },

  "Multiple root queries": {
    dataset: "pokemon",
    code: wrapGroqBuilderQuery(`
      q.project({
          numPokemon: q.raw("count(*[_type == 'pokemon'])", z.number()),
          allTypeNames: q.star.filterByType("poketype").field("name", z.string()),
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
          name: z.string(),
          // pass a raw query with a validation function
          count: q.raw("count(types)", z.number()),
          coalesce: q.raw("coalesce(foo, 'not there')", z.string()),
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
          _id: z.string(),
          ...sub.conditional({
            // For Bulbasaur, grab the HP
            'name == "Bulbasaur"': {
              name: z.literal("Bulbasaur"),
              hp: ["base.HP", z.number()],
            },
            // For Charmander, grab the Attack
            'name == "Charmander"': {
              name: z.literal("Charmander"),
              attack: ["base.Attack", z.number()],
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
          name: z.string(),
          types: sub.field("types").filter().deref().field("name", z.string())
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
         user: sub.field("user").deref().field("name", z.string()),
         title: z.string(),
         completed: z.boolean(),
       }))
    `),
  },
  "Basic Query with VALIDATION ERRORS": {
    dataset: "todo-list-draft",
    code: wrapQueryTodos(`
      q.star
       .filterByType("todo")
       .project(sub => ({
         user: sub.field("user").deref().field("name", z.string()),
         title: z.string(),
         completed: z.boolean(),
       }))
    `),
  },
  "Basic Query with fixed validation errors": {
    dataset: "todo-list-draft",
    code: wrapQueryTodos(`
      q.star
       .filterByType("todo")
       .project(sub => ({
         user: sub.field("user").deref().field("name", z.default(z.string(), "")),
         title: z.default(z.string(), ""),
         completed: z.default(z.boolean().or(z.number().transform(x => x > 0)), false),
         completedRaw: "completed",
       }))
    `),
  },
} satisfies Record<string, ExamplePayload>;
