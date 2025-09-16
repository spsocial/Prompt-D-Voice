import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [scriptForm, setScriptForm] = useState({
    templateId: 'advert30',
    productInfo: '',
    targetAudience: '',
    tone: 'professional',
    keywords: '',
    length: '30 seconds'
  });

  const [generatedScript, setGeneratedScript] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({ speed: 1.0, pitch: 0 });
  const [audioUrl, setAudioUrl] = useState('');
  const [scripts, setScripts] = useState([]);
  const [audioHistory, setAudioHistory] = useState([]);

  const audioRef = useRef(null);

  // Templates
  const templates = [
    { id: 'advert30', name: '📺 โฆษณา 30 วินาที', icon: '🎯', color: '#FF6B6B' },
    { id: 'livestream', name: '🛍️ ไลฟ์ขายของ', icon: '💰', color: '#4ECDC4' },
    { id: 'tiktok', name: '📱 TikTok/Reels', icon: '🎬', color: '#95E1D3' },
    { id: 'review', name: '⭐ รีวิวสินค้า', icon: '📝', color: '#F38181' },
    { id: 'podcast', name: '🎙️ Podcast', icon: '🎧', color: '#AA96DA' },
    { id: 'hardsell', name: '💪 Hard Sell', icon: '🔥', color: '#FC5C65' }
  ];

  const tones = [
    { value: 'professional', label: '💼 มืออาชีพ' },
    { value: 'friendly', label: '😊 เป็นกันเอง' },
    { value: 'energetic', label: '⚡ มีพลัง' },
    { value: 'luxury', label: '💎 หรูหรา' },
    { value: 'casual', label: '☕ สบายๆ' },
    { value: 'urgent', label: '🚨 เร่งด่วน' }
  ];

  // Load voices on mount
  useEffect(() => {
    fetchVoices();
    checkAuth();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/voices`);
      setVoices(response.data.voices);
      if (response.data.voices.length > 0) {
        setSelectedVoice(response.data.voices[0].code);
      }
    } catch (error) {
      console.error('Failed to fetch voices');
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/user/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setCredits(response.data.credits);
      setView('dashboard');
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const handleAuth = async (isLogin) => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API_URL}${endpoint}`, authForm);

      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCredits(response.data.user.credits);
      setView('dashboard');
      setMessage({ text: isLogin ? 'เข้าสู่ระบบสำเร็จ!' : 'สมัครสมาชิกสำเร็จ! ได้รับ 500 เครดิต', type: 'success' });
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'เกิดข้อผิดพลาด', type: 'error' });
    }
    setLoading(false);
  };

  const generateScript = async () => {
    if (!scriptForm.productInfo) {
      setMessage({ text: 'กรุณากรอกข้อมูลสินค้า', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/scripts/generate`,
        scriptForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedScript(response.data.script);
      setCredits(response.data.creditsRemaining);
      setMessage({ text: '✨ สร้างสคริปต์สำเร็จ! (-10 เครดิต)', type: 'success' });
      setView('script-result');
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'ไม่สามารถสร้างสคริปต์ได้', type: 'error' });
    }
    setLoading(false);
  };

  const generateAudio = async () => {
    if (!generatedScript || !selectedVoice) {
      setMessage({ text: 'กรุณาเลือกเสียง', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'กำลังสร้างไฟล์เสียง...', type: 'info' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/tts/generate`,
        {
          text: generatedScript.content,
          voiceCode: selectedVoice,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAudioUrl(response.data.audio.url);
      setCredits(response.data.creditsRemaining);
      setMessage({ text: '🎵 สร้างเสียงสำเร็จ! (-20 เครดิต)', type: 'success' });
      setView('audio-player');
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'ไม่สามารถสร้างเสียงได้', type: 'error' });
    }
    setLoading(false);
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `script-audio-${Date.now()}.mp3`;
      link.click();
      setMessage({ text: '📥 กำลังดาวน์โหลดไฟล์เสียง...', type: 'success' });
    }
  };

  const addCredits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/credits/add`,
        { amount: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCredits(response.data.credits);
      setMessage({ text: '💳 เพิ่ม 100 เครดิตสำเร็จ!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'ไม่สามารถเพิ่มเครดิตได้', type: 'error' });
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('landing');
    setMessage({ text: 'ออกจากระบบแล้ว', type: 'info' });
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: '"Inter", "Kanit", sans-serif',
      color: '#ffffff'
    },
    navbar: {
      background: 'rgba(22, 33, 62, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '2px solid rgba(233, 69, 96, 0.3)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
    },
    logo: {
      fontSize: '1.75rem',
      fontWeight: '800',
      background: 'linear-gradient(90deg, #e94560 0%, #f47068 50%, #ffb347 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px'
    },
    card: {
      background: 'rgba(22, 33, 62, 0.6)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(233, 69, 96, 0.2)',
      borderRadius: '24px',
      padding: '2.5rem',
      marginBottom: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    button: {
      background: 'linear-gradient(135deg, #e94560 0%, #f47068 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '14px 32px',
      borderRadius: '12px',
      fontSize: '1.05rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)',
      transform: 'translateY(0)'
    },
    outlineButton: {
      background: 'transparent',
      color: '#e94560',
      border: '2px solid #e94560',
      padding: '12px 28px',
      borderRadius: '12px',
      fontSize: '1.05rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(15, 52, 96, 0.4)',
      border: '2px solid rgba(233, 69, 96, 0.3)',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '1.05rem',
      marginBottom: '1.2rem',
      transition: 'all 0.3s ease',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(15, 52, 96, 0.4)',
      border: '2px solid rgba(233, 69, 96, 0.3)',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '1.05rem',
      minHeight: '140px',
      resize: 'vertical',
      marginBottom: '1.2rem',
      transition: 'all 0.3s ease',
      outline: 'none',
      lineHeight: '1.6'
    },
    select: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(15, 52, 96, 0.4)',
      border: '2px solid rgba(233, 69, 96, 0.3)',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '1.05rem',
      marginBottom: '1.2rem',
      cursor: 'pointer',
      outline: 'none'
    },
    templateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    templateCard: {
      background: 'rgba(15, 52, 96, 0.3)',
      border: '2px solid rgba(233, 69, 96, 0.2)',
      borderRadius: '16px',
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    activeTemplate: {
      border: '2px solid #e94560',
      background: 'rgba(233, 69, 96, 0.25)',
      boxShadow: '0 0 20px rgba(233, 69, 96, 0.3)',
      transform: 'scale(1.05)'
    },
    voiceCard: {
      background: 'rgba(15, 52, 96, 0.3)',
      border: '2px solid rgba(233, 69, 96, 0.2)',
      borderRadius: '12px',
      padding: '1.2rem',
      marginBottom: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    activeVoice: {
      background: 'rgba(233, 69, 96, 0.2)',
      border: '2px solid #e94560',
      boxShadow: '0 0 15px rgba(233, 69, 96, 0.2)'
    },
    message: {
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '1rem',
      textAlign: 'center',
      fontWeight: '500'
    },
    successMessage: {
      background: 'rgba(72, 187, 120, 0.25)',
      color: '#68D391',
      border: '2px solid #48BB78',
      fontWeight: '600'
    },
    errorMessage: {
      background: 'rgba(245, 101, 101, 0.25)',
      color: '#FC8181',
      border: '2px solid #F56565',
      fontWeight: '600'
    },
    infoMessage: {
      background: 'rgba(66, 153, 225, 0.25)',
      color: '#63B3ED',
      border: '2px solid #4299E1',
      fontWeight: '600'
    },
    creditBadge: {
      background: 'linear-gradient(135deg, #ffb347 0%, #ff6b6b 100%)',
      padding: '10px 24px',
      borderRadius: '24px',
      fontWeight: '700',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1.05rem',
      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
    },
    audioPlayer: {
      background: 'rgba(15, 52, 96, 0.5)',
      borderRadius: '20px',
      padding: '2.5rem',
      marginTop: '2rem',
      border: '2px solid rgba(233, 69, 96, 0.2)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
    },
    slider: {
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      background: 'rgba(233, 69, 96, 0.2)',
      outline: 'none',
      marginBottom: '1.2rem',
      WebkitAppearance: 'none',
      cursor: 'pointer'
    }
  };

  // Landing Page
  if (view === 'landing') {
    return (
      <div style={styles.container}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
          <div style={{textAlign: 'center', marginBottom: '4rem', marginTop: '4rem'}}>
            <h1 style={{fontSize: '4.5rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-2px'}}>
              <span style={{background: 'linear-gradient(90deg, #e94560 0%, #f47068 50%, #ffb347 100%)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Prompt-D-Voice
              </span>
            </h1>
            <p style={{fontSize: '1.75rem', color: '#ffffff', fontWeight: '600'}}>
              🚀 AI Script Generator + Professional Text-to-Speech
            </p>
            <p style={{fontSize: '1.3rem', color: 'rgba(255,255,255,0.85)', marginTop: '1rem', lineHeight: '1.8'}}>
              สร้างสคริปต์ขายของด้วย <span style={{color: '#e94560', fontWeight: 'bold'}}>Gemini AI</span> และแปลงเป็นเสียงคุณภาพสูง
            </p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem'}}>
            <div style={{...styles.card, transform: 'translateY(0)', transition: 'transform 0.3s ease'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🤖</div>
              <h3 style={{fontSize: '1.6rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700'}}>Gemini AI</h3>
              <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: '1.6'}}>
                ใช้ AI ล่าสุดจาก Google สร้างสคริปต์คุณภาพสูง 6 รูปแบบ
              </p>
            </div>
            <div style={{...styles.card, transform: 'translateY(0)', transition: 'transform 0.3s ease'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎙️</div>
              <h3 style={{fontSize: '1.6rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700'}}>30+ เสียง</h3>
              <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: '1.6'}}>
                เสียงระดับ Studio จาก Google Cloud ทั้งไทยและอังกฤษ
              </p>
            </div>
            <div style={{...styles.card, transform: 'translateY(0)', transition: 'transform 0.3s ease'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📥</div>
              <h3 style={{fontSize: '1.6rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700'}}>ดาวน์โหลดได้</h3>
              <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: '1.6'}}>
                ดาวน์โหลดไฟล์ MP3 คุณภาพสูงใช้งานได้ทันที
              </p>
            </div>
          </div>

          <div style={{maxWidth: '500px', margin: '0 auto'}}>
            <div style={styles.card}>
              <h2 style={{textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontWeight: '700'}}>
                {view === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </h2>

              {message.text && (
                <div style={{
                  ...styles.message,
                  ...(message.type === 'success' ? styles.successMessage :
                      message.type === 'error' ? styles.errorMessage : styles.infoMessage)
                }}>
                  {message.text}
                </div>
              )}

              {view !== 'login' && (
                <input
                  style={styles.input}
                  type="text"
                  placeholder="👤 ชื่อ-นามสกุล"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                />
              )}

              <input
                style={styles.input}
                type="email"
                placeholder="📧 อีเมล"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              />

              <input
                style={styles.input}
                type="password"
                placeholder="🔒 รหัสผ่าน"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />

              <button
                style={{...styles.button, width: '100%', justifyContent: 'center', fontSize: '1.15rem'}}
                onClick={() => handleAuth(view === 'login')}
                disabled={loading}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(233, 69, 96, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
                }}
              >
                {loading ? '⏳ กำลังดำเนินการ...' : (view === 'login' ? '🚀 เข้าสู่ระบบ' : '🎉 สมัครสมาชิก (รับ 500 เครดิต)')}
              </button>

              <p style={{textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem'}}>
                {view === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีแล้ว? '}
                <a href="#"
                   onClick={(e) => {
                     e.preventDefault();
                     setView(view === 'login' ? 'landing' : 'login');
                   }}
                   style={{color: '#e94560', textDecoration: 'none', fontWeight: '600'}}>
                  {view === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={styles.logo}>🎙️ Prompt-D-Voice Pro</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <div style={styles.creditBadge}>
            💳 {credits} เครดิต
          </div>
          <button
            style={styles.outlineButton}
            onClick={addCredits}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(233, 69, 96, 0.15)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          >
            เติมเครดิต
          </button>
          <button
            style={{...styles.button, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(233, 69, 96, 0.3)'}}
            onClick={logout}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(233, 69, 96, 0.2)';
              e.target.style.borderColor = '#e94560';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(233, 69, 96, 0.3)';
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.successMessage :
                message.type === 'error' ? styles.errorMessage : styles.infoMessage)
          }}>
            {message.text}
          </div>
        )}

        {/* Script Generation */}
        {view === 'dashboard' && (
          <>
            <div style={styles.card}>
              <h2 style={{fontSize: '2.5rem', marginBottom: '2rem', fontWeight: '700', color: '#ffffff'}}>
                🚀 สร้างสคริปต์ด้วย AI
              </h2>

              <h3 style={{marginBottom: '1.5rem', color: '#e94560', fontSize: '1.3rem', fontWeight: '600'}}>
                📝 เลือกประเภทสคริปต์
              </h3>
              <div style={styles.templateGrid}>
                {templates.map(template => (
                  <div
                    key={template.id}
                    style={{
                      ...styles.templateCard,
                      ...(scriptForm.templateId === template.id ? styles.activeTemplate : {}),
                      borderColor: template.color
                    }}
                    onClick={() => setScriptForm({...scriptForm, templateId: template.id})}
                  >
                    <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{template.icon}</div>
                    <div style={{fontWeight: '600'}}>{template.name}</div>
                  </div>
                ))}
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '0.8rem', color: '#ffffff', fontWeight: '600', fontSize: '1.1rem'}}>
                    🎯 กลุ่มเป้าหมาย
                  </label>
                  <input
                    style={styles.input}
                    placeholder="เช่น วัยรุ่น 18-25 ปี"
                    value={scriptForm.targetAudience}
                    onChange={(e) => setScriptForm({...scriptForm, targetAudience: e.target.value})}
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '0.8rem', color: '#ffffff', fontWeight: '600', fontSize: '1.1rem'}}>
                    🎨 โทนเสียง
                  </label>
                  <select
                    style={styles.select}
                    value={scriptForm.tone}
                    onChange={(e) => setScriptForm({...scriptForm, tone: e.target.value})}
                  >
                    {tones.map(tone => (
                      <option key={tone.value} value={tone.value} style={{background: '#2C5364'}}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={{display: 'block', marginBottom: '0.8rem', color: '#ffffff', fontWeight: '600', fontSize: '1.1rem'}}>
                📦 ข้อมูลสินค้า/บริการ (ละเอียดยิ่งดี)
              </label>
              <textarea
                style={styles.textarea}
                placeholder="อธิบายสินค้า จุดเด่น ราคา โปรโมชั่น..."
                value={scriptForm.productInfo}
                onChange={(e) => setScriptForm({...scriptForm, productInfo: e.target.value})}
                rows="5"
              />

              <label style={{display: 'block', marginBottom: '0.8rem', color: '#ffffff', fontWeight: '600', fontSize: '1.1rem'}}>
                🔑 คีย์เวิร์ดสำคัญ
              </label>
              <input
                style={styles.input}
                placeholder="คำสำคัญที่ต้องการให้มีในสคริปต์"
                value={scriptForm.keywords}
                onChange={(e) => setScriptForm({...scriptForm, keywords: e.target.value})}
              />

              <button
                style={{...styles.button, width: '100%', justifyContent: 'center', fontSize: '1.3rem', padding: '18px', marginTop: '1.5rem'}}
                onClick={generateScript}
                disabled={loading || credits < 10}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(233, 69, 96, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
                }}
              >
                {loading ? '⏳ กำลังสร้างสคริปต์...' : '✨ สร้างสคริปต์ (ใช้ 10 เครดิต)'}
              </button>
            </div>
          </>
        )}

        {/* Script Result */}
        {view === 'script-result' && generatedScript && (
          <>
            <div style={styles.card}>
              <h2 style={{fontSize: '2rem', marginBottom: '2rem'}}>
                📝 สคริปต์ของคุณพร้อมแล้ว!
              </h2>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '2rem',
                marginBottom: '2rem',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.8',
                fontSize: '1.1rem'
              }}>
                {generatedScript.content}
              </div>

              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <button
                  style={styles.button}
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript.content);
                    setMessage({ text: '📋 คัดลอกสคริปต์แล้ว!', type: 'success' });
                  }}
                >
                  📋 คัดลอก
                </button>
                <button
                  style={styles.button}
                  onClick={() => setView('voice-selection')}
                >
                  🎙️ แปลงเป็นเสียง
                </button>
                <button
                  style={styles.outlineButton}
                  onClick={() => setView('dashboard')}
                >
                  🔄 สร้างใหม่
                </button>
              </div>
            </div>
          </>
        )}

        {/* Voice Selection */}
        {view === 'voice-selection' && (
          <>
            <div style={styles.card}>
              <h2 style={{fontSize: '2rem', marginBottom: '2rem'}}>
                🎙️ เลือกเสียงและตั้งค่า
              </h2>

              <div style={{marginBottom: '2rem'}}>
                <h3 style={{marginBottom: '1rem'}}>เสียงภาษาไทย</h3>
                {voices.filter(v => v.language.startsWith('th')).map(voice => (
                  <div
                    key={voice.code}
                    style={{
                      ...styles.voiceCard,
                      ...(selectedVoice === voice.code ? styles.activeVoice : {})
                    }}
                    onClick={() => setSelectedVoice(voice.code)}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <strong>{voice.name}</strong>
                        <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem'}}>
                          {voice.gender === 'FEMALE' ? '👩 หญิง' : '👨 ชาย'}
                        </div>
                      </div>
                      {selectedVoice === voice.code && (
                        <div style={{color: '#667eea'}}>✓ เลือกแล้ว</div>
                      )}
                    </div>
                  </div>
                ))}

                <h3 style={{marginBottom: '1rem', marginTop: '2rem'}}>เสียงภาษาอังกฤษ (Premium)</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem'}}>
                  {voices.filter(v => v.language.startsWith('en')).map(voice => (
                    <div
                      key={voice.code}
                      style={{
                        ...styles.voiceCard,
                        ...(selectedVoice === voice.code ? styles.activeVoice : {})
                      }}
                      onClick={() => setSelectedVoice(voice.code)}
                    >
                      <div>
                        <strong style={{fontSize: '0.9rem'}}>{voice.name}</strong>
                        <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem'}}>
                          {voice.gender === 'FEMALE' ? '👩' : '👨'} {voice.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <h3 style={{marginBottom: '1rem'}}>ตั้งค่าเสียง</h3>

                <label style={{display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)'}}>
                  ความเร็ว: {voiceSettings.speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.speed}
                  onChange={(e) => setVoiceSettings({...voiceSettings, speed: parseFloat(e.target.value)})}
                  style={styles.slider}
                />

                <label style={{display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)'}}>
                  ระดับเสียง: {voiceSettings.pitch > 0 ? '+' : ''}{voiceSettings.pitch}
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings({...voiceSettings, pitch: parseFloat(e.target.value)})}
                  style={styles.slider}
                />
              </div>

              <button
                style={{...styles.button, width: '100%', justifyContent: 'center', fontSize: '1.2rem', padding: '15px'}}
                onClick={generateAudio}
                disabled={loading || credits < 20}
              >
                {loading ? '⏳ กำลังสร้างเสียง...' : '🎵 สร้างไฟล์เสียง (ใช้ 20 เครดิต)'}
              </button>
            </div>
          </>
        )}

        {/* Audio Player */}
        {view === 'audio-player' && audioUrl && (
          <>
            <div style={styles.card}>
              <h2 style={{fontSize: '2rem', marginBottom: '2rem'}}>
                🎵 ไฟล์เสียงของคุณพร้อมแล้ว!
              </h2>

              <div style={styles.audioPlayer}>
                <audio
                  ref={audioRef}
                  controls
                  style={{width: '100%', marginBottom: '2rem'}}
                  src={audioUrl}
                  autoPlay
                />

                <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
                  <button
                    style={{...styles.button, background: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)'}}
                    onClick={downloadAudio}
                  >
                    📥 ดาวน์โหลด MP3
                  </button>
                  <button
                    style={styles.button}
                    onClick={() => setView('voice-selection')}
                  >
                    🔄 เปลี่ยนเสียง
                  </button>
                  <button
                    style={styles.outlineButton}
                    onClick={() => setView('dashboard')}
                  >
                    ✨ สร้างสคริปต์ใหม่
                  </button>
                </div>
              </div>

              <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)',
                          borderRadius: '10px', border: '1px solid rgba(102, 126, 234, 0.3)'}}>
                <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.8)'}}>
                  💡 เคล็ดลับ: ไฟล์เสียงจะถูกบันทึกในระบบ คุณสามารถดาวน์โหลดได้ตลอดเวลา
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;