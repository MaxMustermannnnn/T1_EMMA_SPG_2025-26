import { useState, useEffect } from 'react'

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    // Test Backend-Verbindung
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🚗 Fahrzeug-Wartungsbuch
        </h1>
        <p className="text-gray-600 mb-4">
          Digitales Wartungsbuch mit automatischen Erinnerungen
        </p>
        
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">Backend Status:</p>
          <p className={`font-semibold ${
            apiStatus === 'ok' ? 'text-green-600' : 'text-red-600'
          }`}>
            {apiStatus === 'ok' ? '✅ Verbunden' : '❌ ' + apiStatus}
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Bereit zum Entwickeln! 🚀
        </div>
      </div>
    </div>
  )
}

export default App
