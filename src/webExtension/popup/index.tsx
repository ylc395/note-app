import { createRoot } from 'react-dom/client';
import App from './view/App';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
