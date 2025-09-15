import { useState, useEffect } from 'react';
import axios from 'axios';

function Settings({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('api');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [apiKeys, setApiKeys] = useState({
    geminiKey: user.apiKeys?.geminiKey || '',
    googleKey: user.apiKeys?.googleKey || ''
  });
  
  const [settings, setSettings] = useState({
    fontSize: user.settings?.fontSize || 16,
    theme: user.settings?.theme || 'dark',
    language: user.settings?.language || 'th'
  });
  
  const [prompts, setPrompts] = useState({
    adSpot: user.prompts?.adSpot || '',
    liveSale: user.prompts?.liveSale || '',
    tiktok: user.prompts?.tiktok || '',
    custom: user.prompts?.custom || '',
    podcast: user.prompts?.podcast || ''
  });

  const promptLabels = {
    adSpot: 'โฆษณาสั้น (Ad Spot)',
    liveSale: 'ไลฟ์ขายสินค้า',
    tiktok: 'TikTok',
    custom: 'กำหนดเอง',
    podcast: 'พอดแคสต์'
  };

  const handleApiKeyChange = (e) => {
    setApiKeys({
      ...apiKeys,
      [e.target.name]: e.target.value
    });
  };

  const handleSettingsChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handlePromptChange = (e) => {
    setPrompts({
      ...prompts,
      [e.target.name]: e.target.value
    });
  };

  const saveApiKeys = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/user/update-api-keys', apiKeys);
      setMessage('บันทึก API Keys สำเร็จ');
      setUser({ ...user, apiKeys: { ...user.apiKeys, ...apiKeys } });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึก API Keys');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/user/update-settings', { settings });
      setMessage('บันทึกการตั้งค่าสำเร็จ');
      setUser({ ...user, settings });
      
      // Apply font size
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const savePrompts = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/user/update-prompts', { prompts });
      setMessage('บันทึก Prompts สำเร็จ');
      setUser({ ...user, prompts });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึก Prompts');
    } finally {
      setLoading(false);
    }
  };

  const resetPrompt = (type) => {
    const defaultPrompts = {
      adSpot: process.env.DEFAULT_AD_SPOT_PROMPT || 'สร้างสคริปต์โฆษณาสั้น 30 วินาที สำหรับ {topic}',
      liveSale: process.env.DEFAULT_LIVE_SALE_PROMPT || 'สร้างสคริปต์ไลฟ์ขายสินค้า สำหรับ {topic}',
      tiktok: process.env.DEFAULT_TIKTOK_PROMPT || 'สร้างสคริปต์ TikTok สั้นๆ กระชับ สำหรับ {topic}',
      custom: process.env.DEFAULT_CUSTOM_PROMPT || 'สร้างสคริปต์ตามความต้องการสำหรับ {topic}',
      podcast: process.env.DEFAULT_PODCAST_PROMPT || 'สร้างสคริปต์พอดแคสต์ สำหรับหัวข้อ {topic}'
    };
    
    setPrompts({
      ...prompts,
      [type]: defaultPrompts[type]
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ตั้งค่า</h1>
        <p className="page-subtitle">จัดการ API Keys และปรับแต่งการทำงาน</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('สำเร็จ') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Configuration
        </button>
        <button
          className={`tab ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          Display Settings
        </button>
        <button
          className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          System Prompts
        </button>
      </div>

      {/* API Configuration Tab */}
      {activeTab === 'api' && (
        <div className="card">
          <h2 className="card-title">API Keys Configuration</h2>
          
          <div className="form-group">
            <label className="form-label">
              Gemini API Key <span style={{ color: 'var(--error)' }}>*จำเป็น</span>
            </label>
            <input
              type="password"
              name="geminiKey"
              className="form-input"
              value={apiKeys.geminiKey}
              onChange={handleApiKeyChange}
              placeholder="AIza..."
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '5px' }}>
              ได้รับ API Key ฟรีจาก <a href="https://makersuite.google.com/app/apikey" target="_blank" style={{ color: 'var(--accent)' }}>Google AI Studio</a>
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              Google Cloud TTS API Key <span style={{ color: 'var(--text-secondary)' }}>(ไม่บังคับ)</span>
            </label>
            <input
              type="password"
              name="googleKey"
              className="form-input"
              value={apiKeys.googleKey}
              onChange={handleApiKeyChange}
              placeholder="สำหรับใช้ Google Text-to-Speech"
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '5px' }}>
              หากไม่ใส่จะใช้ Edge TTS ฟรีแทน
            </small>
          </div>

          <button
            className="btn btn-primary"
            onClick={saveApiKeys}
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก API Keys'}
          </button>
        </div>
      )}

      {/* Display Settings Tab */}
      {activeTab === 'display' && (
        <div className="card">
          <h2 className="card-title">Display Settings</h2>
          
          <div className="form-group">
            <label className="form-label">ขนาดตัวอักษร</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <input
                type="range"
                name="fontSize"
                min="12"
                max="20"
                value={settings.fontSize}
                onChange={handleSettingsChange}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '50px' }}>{settings.fontSize}px</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ธีม</label>
            <select
              name="theme"
              className="form-select"
              value={settings.theme}
              onChange={handleSettingsChange}
            >
              <option value="dark">Dark Mode</option>
              <option value="light" disabled>Light Mode (เร็วๆ นี้)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ภาษาหลัก</label>
            <select
              name="language"
              className="form-select"
              value={settings.language}
              onChange={handleSettingsChange}
            >
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      )}

      {/* System Prompts Tab */}
      {activeTab === 'prompts' && (
        <div className="card">
          <h2 className="card-title">System Prompts</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            ปรับแต่ง prompts สำหรับการสร้างสคริปต์แต่ละประเภท ใช้ {'{topic}'} เพื่อแทนที่ข้อมูลสินค้า
          </p>
          
          {Object.keys(prompts).map(type => (
            <div key={type} className="form-group">
              <label className="form-label">
                {promptLabels[type]}
                <button
                  onClick={() => resetPrompt(type)}
                  style={{
                    marginLeft: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </label>
              <textarea
                name={type}
                className="form-textarea"
                value={prompts[type]}
                onChange={handlePromptChange}
                rows="4"
              />
            </div>
          ))}

          <button
            className="btn btn-primary"
            onClick={savePrompts}
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก Prompts'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Settings;