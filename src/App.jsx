import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [colors, setColors] = useState({ light: [], dark: [] })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setColors({ light: [], dark: [] })

    try {
      const response = await fetch('/api/extract-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract colors')
      }

      setColors(data)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color)
    // You could add a toast notification here
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎨 Color Extractor</h1>
          <p>Extract color palettes from any webpage</p>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a webpage URL (e.g., https://example.com)"
              className="url-input"
              required
              disabled={loading}
            />
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Extracting...' : 'Extract Colors'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {colors.light.length > 0 || colors.dark.length > 0 ? (
          <div className="results">
            <div className="results-header">
              <h2>Color Palettes</h2>
              <span className="total-count">
                {colors.light.length + colors.dark.length} colors found
              </span>
            </div>

            {colors.dark.length > 0 && (
              <div className="palette-section">
                <h3 className="palette-title">
                  🌙 Dark Colors ({colors.dark.length})
                </h3>
                <div className="color-grid">
                  {colors.dark.map((color, index) => (
                    <div
                      key={`dark-${index}`}
                      className="color-item"
                      style={{ backgroundColor: color }}
                      onClick={() => copyToClipboard(color)}
                      title={`Click to copy ${color}`}
                    >
                      <span className="color-code">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {colors.light.length > 0 && (
              <div className="palette-section">
                <h3 className="palette-title">
                  ☀️ Light Colors ({colors.light.length})
                </h3>
                <div className="color-grid">
                  {colors.light.map((color, index) => (
                    <div
                      key={`light-${index}`}
                      className="color-item light"
                      style={{ backgroundColor: color }}
                      onClick={() => copyToClipboard(color)}
                      title={`Click to copy ${color}`}
                    >
                      <span className="color-code">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !loading && url && (
          <div className="empty-state">
            <p>Enter a URL above to extract colors from a webpage</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

