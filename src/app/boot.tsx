import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadRuntimeConfig, RuntimeConfigError } from '../shared/config';
import { App } from './App';
import './styles/tokens.css';

function renderBootFailure(container: Element, error: unknown) {
  const detail =
    error instanceof RuntimeConfigError
      ? error.message
      : 'Onbekende fout tijdens het laden van de configuratie.';

  const root = createRoot(container);
  root.render(
    <div role="alert">
      <h1>Taldo kan niet worden gestart.</h1>
      <p>De applicatieconfiguratie kon niet worden geladen.</p>
      <p>{detail}</p>
    </div>,
  );
}

/**
 * Boot sequence: resolves runtime config before rendering anything that depends on it.
 * On failure, renders a minimal fail-fast error screen directly (not the full app shell)
 * with the error detail visible — never a silent fallback URL.
 */
export async function bootApp(container: Element): Promise<void> {
  try {
    await loadRuntimeConfig();
  } catch (error) {
    renderBootFailure(container, error);
    return;
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
