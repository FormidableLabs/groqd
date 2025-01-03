import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: "tsc",
      allowJs: false,
      include: ["**.test.ts"],
    },
    exclude: [...configDefaults.exclude],
  },
});
