import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    envDir: path.resolve(""),
    test: {
        include: [
            "./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ],
        globals: true,
        typecheck: {
            tsconfig: "tsconfig.json",
        },
        environment: "node",
    },
});
