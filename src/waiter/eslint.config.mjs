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
  ]),
  // ═══════════════════════════════════════════════════════════════
  // IMIDUS Brand Token Enforcement Rules
  // ═══════════════════════════════════════════════════════════════
  {
    rules: {
      // Block raw hex colors and color functions
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/]",
          message: "Raw hex colors are not allowed. Use CSS variables from '@/styles/tokens/colors.css' like: var(--brand-blue)",
        },
        {
          selector: "CallExpression[callee.name=/^(rgb|rgba|hsl|hsla)$/]",
          message: "Raw rgb/rgba/hsl/hsl colors not allowed. Use CSS variables like var(--brand-blue)",
        },
        {
          selector: "TemplateElement[value.raw=/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/]",
          message: "No raw hex colors in template literals. Use CSS variables like var(--brand-blue)",
        },
      ],
    },
  },
]);

export default eslintConfig;
