// Punto de entrada aislado del Playground (sólo desarrollo): /src/fx/playground.html
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import { Playground } from './Playground';

createRoot(document.getElementById('root')!).render(<Playground />);
