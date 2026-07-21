import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Read-only porting reference and generated migrations — not app code.
    "reference/**",
    "drizzle/**",
    // Handover docs + the extracted original app (reference only, not shipped).
    "Data/**",
  ]),
]);

export default eslintConfig;
