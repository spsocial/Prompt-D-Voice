import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ user }) {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user?.name || 'User'}!</h1>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h2>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <Link
            to="/script-generator"
            style={{
              padding: '20px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              display: 'block'
            }}
          >
            📝 Script Generator
          </Link>

          <Link
            to="/text-to-speech"
            style={{
              padding: '20px',
              background: '#764ba2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              display: 'block'
            }}
          >
            🎙️ Text to Speech
          </Link>

          <Link
            to="/settings"
            style={{
              padding: '20px',
              background: '#f59e0b',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              display: 'block'
            }}
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* API Key Warning */}
      {!user?.apiKeys?.geminiKey && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          color: '#856404',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          ⚠️ Please configure your Gemini API key in Settings to use all features
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Scripts Created</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {user?.scriptsCount || 0}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#764ba2', marginBottom: '10px' }}>Audio Generated</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {user?.audioCount || 0}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Account Type</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {user?.accountType || 'Free'}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2>Recent Activity</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          No recent activity to display
        </p>
      </div>
    </div>
  );
}

export default Dashboard;