import ReactDOM from 'react-dom/client'
import App from './App'

/* ── Skin / global CSS ─────────────────────────────────────── */
import './skin/root.css'
import './skin/layout.css'
import './skin/typography.css'
import './skin/toast-noti.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
