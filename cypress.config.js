const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.FACTTIC_API_URL || "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      API_SECRET: process.env.VOICE_WEBHOOK_SECRET || "test-secret",
      BYOK_KEY: process.env.BYOK_TEST_KEY || "test-byok-encryption-key-k6-mock"
    },
    video: false, // Disabling video to speed up CI/CD pipeline
    supportFile: false
  },
});
