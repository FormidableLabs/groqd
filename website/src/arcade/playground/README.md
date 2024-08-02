# playground

In the Arcade code window, you can import from this `playground` folder.

```ts
import { runQuery } from "playground";
import { q } from "playground/pokemon"
```

### Compiling

This folder gets compiled when you run `npm run dev` or `npm run gather-types`.  If you make changes to these files, you must run this command again.  

All `.d.ts` files must be committed in this folder.

Please note, that some standalone `.d.ts` files exist too, without a corresponding `.ts` file.

After compiling the typescript, we read the contents of all `.d.ts` files, and store these contents into `./src/types.json`.  This allows us to load these types into the Monaco Editor in the browser.
