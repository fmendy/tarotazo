import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles/tokens.css';
import './styles/app.css';
import { setFetch } from './lib/api';
import { App } from './App';

async function boot() {
  if (import.meta.env.VITE_MOCK_API === '1') {
    const { mockFetch } = await import('./lib/mock');
    setFetch(mockFetch);
    console.info('[arcana] API simulada (VITE_MOCK_API=1)');
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void boot();
