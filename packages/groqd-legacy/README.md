[![GROQD](https://oss.nearform.com/api/banner?badge=groqd&bg=c99f46)](https://commerce.nearform.com/open-source/groqd)

**[Check out the official documentation.](https://commerce.nearform.com/open-source/groqd)**

`groqd` is a schema-unaware, runtime-safe query builder for [GROQ](https://www.sanity.io/docs/groq). **The goal of `groqd` is to give you (most of) the flexibility of GROQ, with the runtime/type safety of [Zod](https://github.com/colinhacks/zod) and TypeScript.**

`groqd` works by accepting a series of GROQ operations, and generating a query to be used by GROQ and a Zod schema to be used for parsing the associated GROQ response.

An illustrative example:

```ts
import { q } from "groqd";

// Get all of the Pokemon types, and the Pokemon associated to each type.
const { query, schema } = q("*")
  .filter("_type == 'poketype'")
  .grab({
    name: q.string(),
    pokemons: q("*")
      .filter("_type == 'pokemon' && references(^._id)")
      .grab({ name: q.string() }),
  });

// Use the schema and the query as you see fit, for example:
const response = schema.parse(await sanityClient.fetch(query));

// At this point, response has a type of:
// { name: string, pokemons: { name: string }[] }[]
// 👆👆
```

## Support

Have a question about Groqd? Submit an issue in this repository using the
["Question" template](https://github.com/FormidableLabs/groqd/issues/new?template=question.md).

Notice something inaccurate or confusing? Feel free to [open an issue](https://github.com/FormidableLabs/groqd/issues/new/choose) or [make a pull request](https://github.com/FormidableLabs/groqd/pulls) to help improve the documentation for everyone!

The source for our docs site lives in this repo in the [`docs`](https://github.com/FormidableLabs/groqd/blob/main/website/docs) folder.

## Contributing

Please see our [contributing guide](CONTRIBUTING.md).

## Maintenance Status

**Active:** Nearform is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
