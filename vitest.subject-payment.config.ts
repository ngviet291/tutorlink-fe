import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  envDir: false,
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: [
      "src/features/subject/**/*.test.ts",
      "src/features/admin/service/payment-contracts.test.ts",
      "src/features/wallet/**/*.test.ts",
    ],
  },
});
