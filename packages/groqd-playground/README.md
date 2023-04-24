## Groqd Playground

Groqd Playground is a plugin for Sanity Studio for testing [groqd](https://formidable.com/open-source/groqd/) queries, featuring:

- a TypeScript editor experience with syntax/type highlighting;
- parsed response and error messages for when responses fail to pass Zod validation;
- dataset/api version switchers.

![Screenshot of Groqd Playground in action](https://raw.githubusercontent.com/FormidableLabs/groqd/main/docs/img/groqd-playground-sample.png)

To setup, just `yarn add groqd-playground` and then add the `groqdPlaygroundTool` plugin to your sanity config:

```ts
import { defineConfig } from "sanity";
import { groqdPlaygroundTool } from "groqd-playground";

export default defineConfig({
	/* ... */
  plugins: [groqdPlaygroundTool()],
});
```

### [See the docs for more information!](https://formidable.com/open-source/groqd/groqd-playground)
