import React, { useState } from 'react';
import axios from 'axios';

function TextToSpeech({ user }) {
  const [formData, setFormData] = useState({
    text: '',
    voice: 'th-TH-PremwadeeNeural',
    provider: 'edge'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const voices = {
    edge: [
      { value: 'th-TH-PremwadeeNeural', label: 'Thai - Premwadee (Female)' },
      { value: 'th-TH-NiwatNeural', label: 'Thai - Niwat (Male)' },
      { value: 'en-US-JennyNeural', label: 'English - Jenny (Female)' },
      { value: 'en-US-GuyNeural', label: 'English - Guy (Male)' }
    ]
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAudioUrl('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/tts/generate',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Text to Speech</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* Form Section */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Generate Audio</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}>
                Text to Convert
              </label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="Enter text to convert to speech..."
                required
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}>
                Voice
              </label>
              <select
                name="voice"
                value={formData.voice}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                {voices[formData.provider]?.map(voice => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div style={{
                background: '#fee',
                color: '#c00',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Generating...' : 'Generate Audio'}
            </button>
          </form>
        </div>

        {/* Audio Player Section */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Audio Player</h2>
          {audioUrl ? (
            <div>
              <audio
                controls
                src={audioUrl}
                style={{ width: '100%', marginTop: '20px' }}
              />
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = audioUrl;
                  a.download = 'audio.mp3';
                  a.click();
                }}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download Audio
              </button>
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '20px' }}>
              No audio generated yet. Enter text and click "Generate Audio" to create audio.
            </p>
          )}
        </div>
      </div>

      {/* Usage Tips */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #0ea5e9',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#0369a1', marginBottom: '10px' }}>💡 Tips</h3>
        <ul style={{ color: '#0c4a6e', marginLeft: '20px' }}>
          <li>Edge TTS is free and supports multiple languages</li>
          <li>Maximum text length is 5000 characters</li>
          <li>You can download the generated audio for offline use</li>
        </ul>
      </div>
    </div>
  );
}

export default TextToSpeech;