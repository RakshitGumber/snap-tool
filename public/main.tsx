import { createRoot } from 'react-dom/client'
import '@public/styles/global.css'

function App() {
	return <div>Hello</div>
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
