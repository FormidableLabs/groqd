import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: "tsc",
      allowJs: false,
    },
    exclude: [...configDefaults.exclude],
  },
});
