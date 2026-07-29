import nextPlugin from "eslint-config-next";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  ...nextPlugin,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "quote-props": ["error", "as-needed"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
  {
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: [
      "src/app/finanzas/page.tsx",
      "src/app/negocio/page.tsx",
      "src/app/journal/JournalForm.tsx",
    ],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  {
    files: [
      "src/components/SmartDictationButton.tsx",
      "src/components/ThemeToggle.tsx",
      "src/components/challenges/ChallengeNotify.tsx",
      "src/components/circles/CircleWidget.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
