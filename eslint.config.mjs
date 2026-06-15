import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Project rules: enforce the type-safety and hygiene constraints we committed to.
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // No `any` — ever. External data must be parsed with Zod instead.
      "@typescript-eslint/no-explicit-any": "error",

      // Unused vars are errors, but allow a leading underscore as an explicit
      // "intentionally unused" marker (e.g. unused fn args, ignored destructures).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Force `import type { Foo }` for type-only imports — clearer intent and
      // lets the bundler drop them entirely.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Non-null assertions (`!`) are allowed only when truly necessary; warn so
      // each use is a deliberate, reviewed choice rather than a reflex.
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Deterministic, autofixable import ordering.
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  // Turn off any stylistic rules that would fight Prettier. Must come last.
  prettier,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
