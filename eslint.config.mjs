
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser,
        },
        plugins: {
            typescriptEslint,
        },
        rules: {
            ...typescriptEslint.configs.recommended.rules
        },
    }
]