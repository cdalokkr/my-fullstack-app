import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "dist/**",
      ".swc/**",
      "backups/**",
    ],
  },
  {
    files: ["**/*.{js,jsx}"],
    rules: {
      // Basic JavaScript rules
      "no-unused-vars": "off", // Disabled for now
      "no-undef": "off", // Disabled for now
      "no-unreachable": "warn",
      "no-unreachable-loop": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // TypeScript-specific rules can be added here
      "no-unused-vars": "off", // Disabled for now
      "no-undef": "off", // Disabled for now
      "no-unreachable": "warn",
      "no-unreachable-loop": "warn",
    },
  },
];
