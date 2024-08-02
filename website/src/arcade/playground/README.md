# playground

In the Arcade code window, you can import this `playground` folder.

```ts
import { runQuery } from "playground";
import { q } from "playground/pokemon"
```

### Compiling

A few important things to note about how this gets compiled.

1. The `gather-types` script

1. The type def files (`*.d.ts`) must exist; they don't get compiled.  These are 
2. The actual code files (`*.ts`)

This folder gets compiled by the `gather-types` script, so that
it can be bundled
