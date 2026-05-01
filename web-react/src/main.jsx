import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Toaster } from 'sonner'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-800 min-h-screen font-mono">
          <h1 className="text-xl font-bold mb-4">⚠️ Application Error</h1>
          <p className="mb-2">Something went wrong while rendering the app.</p>
          <div className="bg-white p-4 rounded border border-red-200 overflow-auto text-sm">
            <strong>Error Message:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload() }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Storage & Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

console.log('🚀 Starting WeChat Clone React App...')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors expand={false} />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
