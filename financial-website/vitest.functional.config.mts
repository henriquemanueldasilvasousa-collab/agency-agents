import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/functional/**/*.test.ts"],
    globalSetup: ["tests/functional/global-setup.ts"],
    testTimeout: 15000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
