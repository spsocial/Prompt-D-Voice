import React from 'react';
import './App.css';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '20px',
          fontSize: '2.5em'
        }}>
          🎙️ Prompt-D-Voice
        </h1>

        <p style={{
          color: '#666',
          fontSize: '1.2em',
          marginBottom: '30px'
        }}>
          AI-Powered Script Generator & Text-to-Speech
        </p>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#f0f0f0',
            padding: '20px',
            borderRadius: '10px',
            flex: '1',
            minWidth: '150px'
          }}>
            <h3>📝 Script Generator</h3>
            <p>Generate professional scripts with AI</p>
          </div>

          <div style={{
            background: '#f0f0f0',
            padding: '20px',
            borderRadius: '10px',
            flex: '1',
            minWidth: '150px'
          }}>
            <h3>🔊 Text to Speech</h3>
            <p>Convert your text to natural voice</p>
          </div>
        </div>

        <div style={{
          background: '#e8f4ff',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h4>🚀 Status</h4>
          <p style={{ color: '#0066cc' }}>
            Frontend: ✅ Deployed on GitHub Pages<br/>
            Backend: 🔧 Deploy on Railway/Render
          </p>
        </div>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{ color: '#999', fontSize: '0.9em' }}>
            Created with React + Node.js + AI
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;