import { createRoot } from 'react-dom/client'
import App from './App';
import { AuthWrapper } from './components/context/auth.context';

createRoot(document.getElementById('root')).render(
  <AuthWrapper>
    <App />
  </AuthWrapper>
)

