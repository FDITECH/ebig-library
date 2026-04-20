import ReactDOM from 'react-dom/client'
import App from './App'
import { i18n } from './language/i18n'

/* ── Skin / global CSS ─────────────────────────────────────── */
import './assets/root.css'
import './assets/layout.css'
import './assets/typography.css'
import './assets/toast-noti.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
