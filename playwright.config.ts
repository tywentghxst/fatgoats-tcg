import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:3180",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "PORT=3180 DATA_DIR=/tmp/fatgoats-ui-tests node server/index.mjs",
    url: "http://127.0.0.1:3180/api/config",
    reuseExistingServer: false,
  },
  workers: 1,
});
