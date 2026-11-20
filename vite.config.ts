import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { keycloakify } from 'keycloakify/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Builds the Keycloak login theme from src/keycloak-theme (see src/keycloak-theme/README.md).
    keycloakify({
      themeName: 'taldo',
      accountThemeImplementation: 'none',
      // We run Keycloak 26 (taldo-api/docker-compose.yaml); only build the JAR for that range.
      keycloakVersionTargets: {
        '22-to-25': false,
        'all-other-versions': 'taldo-keycloak-theme.jar',
      },
      startKeycloakOptions: {
        dockerImage: 'quay.io/keycloak/keycloak:26.8.1',
        // 8080 is taken by the taldo-api Keycloak; this one is only for theme development.
        port: 8180,
        realmJsonFilePath: './src/keycloak-theme/dev/taldo-dev-realm.json',
        // Joins the taldo-api compose network so verification mails reach its Mailpit (http://localhost:8025).
        dockerExtraArgs: ['--network', 'taldo-infra_default'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
