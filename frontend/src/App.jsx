import { useState, useEffect } from 'react'
import MainApp from './components/MainApp'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')
  
  useEffect(() => {
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health')
      if (response.ok) {
        setApiStatus('connected')
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      setApiStatus('disconnected')
      console.error('API connection error:', error)
    }
  }

  return (
    <div className="w-full">
      {/* Simple Status Bar - only show on homepage and not on dashboards */}
      {!window.location.pathname.includes('dashboard') && (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm w-full">
          <span>System Status: </span>
          <span className={`font-medium ${
            apiStatus === 'connected' ? 'text-green-200' : 
            apiStatus === 'disconnected' ? 'text-red-200' : 'text-yellow-200'
          }`}>
            {apiStatus.toUpperCase()}
          </span>
          <button 
            onClick={checkApiConnection}
            className="ml-4 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full">
        <MainApp />
      </main>
    </div>
  )
}

export default App