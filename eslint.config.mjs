import robloxTsX from "eslint-plugin-roblox-ts-x";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/out/**",
            "**/node_modules/**",
            "**/*.tgz",
            "docs/**",
            "_test_/**",
            "**/*.d.ts",
        ],
    },

    ...tseslint.configs.recommended,

    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "roblox-ts-x": robloxTsX,
        },
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        rules: {
            ...robloxTsX.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": "warn",
            "roblox-ts-x/lua-truthiness": "off",
            "roblox-ts-x/misleading-lua-tuple-checks": "off",
            "roblox-ts-x/no-user-defined-lua-tuple": "off",
        },
    }
);