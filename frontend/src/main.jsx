import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode intentionally OFF — double-mount in dev was firing duplicate
// Seedance polls. Re-enable once side effects are properly idempotent.
createRoot(document.getElementById('root')).render(<App />)
