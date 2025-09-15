import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [scriptForm, setScriptForm] = useState({
    type: 'adSpot30',
    productInfo: '',
    tone: 'friendly',
    targetAudience: 'ทุกเพศทุกวัย',
    duration: '30 วินาที'
  });

  const [generatedScript, setGeneratedScript] = useState(null);
  const [ttsText, setTtsText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Script templates
  const templates = [
    { id: 'adSpot30', name: '📺 โฆษณา 30 วินาที', desc: 'สำหรับโฆษณาทีวี/ออนไลน์' },
    { id: 'liveSale', name: '🛒 ขายสดไลฟ์', desc: 'บทพูดขายแบบไลฟ์สตรีม' },
    { id: 'tiktok', name: '📱 TikTok 15 วินาที', desc: 'คอนเทนต์สั้นกระชับ' },
    { id: 'review', name: '⭐ รีวิวสินค้า', desc: 'รีวิวแบบน่าเชื่อถือ' },
    { id: 'podcast', name: '🎙️ Podcast', desc: 'บทพูดแบบเป็นกันเอง' },
    { id: 'storytelling', name: '📖 เล่าเรื่อง', desc: 'ขายผ่านการเล่าเรื่อง' }
  ];

  const tones = [
    { value: 'friendly', label: '😊 เป็นกันเอง' },
    { value: 'professional', label: '💼 มืออาชีพ' },
    { value: 'excited', label: '🎉 ตื่นเต้น' },
    { value: 'urgent', label: '⚡ เร่งด่วน' },
    { value: 'emotional', label: '❤️ อารมณ์' }
  ];

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setIsLoggedIn(true);
      fetchCredits();
      fetchScripts();
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(response.data.credits);
    } catch (error) {
      console.error('Failed to fetch credits');
    }
  };

  const fetchScripts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/scripts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScripts(response.data);
    } catch (error) {
      console.error('Failed to fetch scripts');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginForm);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsLoggedIn(true);
      setMessage('เข้าสู่ระบบสำเร็จ!');
      setCurrentView('generate');
      fetchCredits();
    } catch (error) {
      setMessage('เข้าสู่ระบบไม่สำเร็จ');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, registerForm);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsLoggedIn(true);
      setMessage('สมัครสมาชิกสำเร็จ! ได้รับ 100 เครดิตฟรี');
      setCurrentView('generate');
      setCredits(100);
    } catch (error) {
      setMessage('สมัครไม่สำเร็จ - อีเมลนี้มีผู้ใช้แล้ว');
    }
    setLoading(false);
  };

  const generateScript = async () => {
    if (!scriptForm.productInfo) {
      setMessage('กรุณากรอกข้อมูลสินค้า');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/scripts/generate`,
        scriptForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedScript(response.data.script);
      setCredits(response.data.creditsRemaining);
      setMessage('สร้างสคริปต์สำเร็จ! ใช้ 5 เครดิต');
      fetchScripts();
    } catch (error) {
      setMessage(error.response?.data?.error || 'ไม่สามารถสร้างสคริปต์ได้');
    }
    setLoading(false);
  };

  const generateTTS = async () => {
    if (!ttsText) {
      setMessage('กรุณาใส่ข้อความที่ต้องการแปลงเป็นเสียง');
      return;
    }

    setLoading(true);
    try {
      // Use Web Speech API for demo
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = 'th-TH';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);

      setMessage('กำลังเล่นเสียง...');
      setCredits(credits - 10);
    } catch (error) {
      setMessage('ไม่สามารถสร้างเสียงได้');
    }
    setLoading(false);
  };

  const addFreeCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/credits/add`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCredits(response.data.credits);
      setMessage('ได้รับ 100 เครดิตฟรี!');
    } catch (error) {
      setMessage('ไม่สามารถเพิ่มเครดิตได้');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('home');
    setMessage('ออกจากระบบแล้ว');
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Kanit, sans-serif',
      padding: '20px'
    },
    navbar: {
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '15px',
      padding: '15px 30px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#667eea'
    },
    navButtons: {
      display: 'flex',
      gap: '10px'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: '#667eea',
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'transform 0.2s'
    },
    outlineButton: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: '2px solid #667eea',
      background: 'transparent',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500'
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333'
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#555'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '16px',
      minHeight: '120px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    scriptCard: {
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '15px'
    },
    scriptContent: {
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.6',
      marginTop: '10px'
    },
    credits: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      textAlign: 'center',
      fontSize: '18px'
    },
    alert: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      background: '#e8f4ff',
      color: '#0066cc',
      textAlign: 'center'
    },
    templateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    templateCard: {
      padding: '15px',
      borderRadius: '10px',
      border: '2px solid #e0e0e0',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    templateCardActive: {
      border: '2px solid #667eea',
      background: '#f0f4ff'
    }
  };

  // Main render
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={{maxWidth: '500px', margin: '0 auto', paddingTop: '50px'}}>
          <div style={styles.card}>
            <h1 style={{textAlign: 'center', fontSize: '36px', marginBottom: '10px'}}>
              🎙️ Prompt-D-Voice
            </h1>
            <p style={{textAlign: 'center', color: '#666', marginBottom: '30px'}}>
              AI ช่วยสร้างสคริปต์ขายของ + แปลงเป็นเสียงพูด
            </p>

            {message && <div style={styles.alert}>{message}</div>}

            {currentView === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>อีเมล</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>รหัสผ่าน</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button style={{...styles.button, width: '100%'}} type="submit" disabled={loading}>
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
                <p style={{textAlign: 'center', marginTop: '20px'}}>
                  ยังไม่มีบัญชี?{' '}
                  <a href="#" onClick={() => setCurrentView('register')} style={{color: '#667eea'}}>
                    สมัครสมาชิก
                  </a>
                </p>
              </form>
            ) : currentView === 'register' ? (
              <form onSubmit={handleRegister}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ชื่อ</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    placeholder="ชื่อของคุณ"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>อีเมล</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>รหัสผ่าน</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    minLength="6"
                    required
                  />
                </div>
                <button style={{...styles.button, width: '100%'}} type="submit" disabled={loading}>
                  {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก (รับ 100 เครดิตฟรี)'}
                </button>
                <p style={{textAlign: 'center', marginTop: '20px'}}>
                  มีบัญชีแล้ว?{' '}
                  <a href="#" onClick={() => setCurrentView('login')} style={{color: '#667eea'}}>
                    เข้าสู่ระบบ
                  </a>
                </p>
              </form>
            ) : (
              <div style={{textAlign: 'center'}}>
                <button style={{...styles.button, margin: '10px'}} onClick={() => setCurrentView('login')}>
                  เข้าสู่ระบบ
                </button>
                <button style={{...styles.outlineButton, margin: '10px'}} onClick={() => setCurrentView('register')}>
                  สมัครสมาชิกฟรี
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Logged in view
  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={styles.logo}>🎙️ Prompt-D-Voice</div>
        <div style={styles.navButtons}>
          <button style={styles.outlineButton} onClick={() => setCurrentView('generate')}>
            📝 สร้างสคริปต์
          </button>
          <button style={styles.outlineButton} onClick={() => setCurrentView('tts')}>
            🔊 แปลงเสียง
          </button>
          <button style={styles.outlineButton} onClick={() => setCurrentView('history')}>
            📚 ประวัติ
          </button>
          <button style={styles.button} onClick={handleLogout}>
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        {/* Credits Display */}
        <div style={styles.credits}>
          <div>💳 เครดิตคงเหลือ: {credits} เครดิต</div>
          <button
            style={{...styles.button, background: 'white', color: '#667eea', marginTop: '10px'}}
            onClick={addFreeCredits}
          >
            รับเครดิตฟรี +100
          </button>
        </div>

        {message && <div style={styles.alert}>{message}</div>}

        {/* Generate Script View */}
        {currentView === 'generate' && (
          <div style={styles.card}>
            <h2 style={styles.title}>🚀 สร้างสคริปต์ขายของด้วย AI</h2>
            <p style={styles.subtitle}>เลือกรูปแบบและกรอกข้อมูลสินค้า AI จะสร้างสคริปต์ให้ทันที</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>เลือกรูปแบบสคริปต์</label>
              <div style={styles.templateGrid}>
                {templates.map(template => (
                  <div
                    key={template.id}
                    style={{
                      ...styles.templateCard,
                      ...(scriptForm.type === template.id ? styles.templateCardActive : {})
                    }}
                    onClick={() => setScriptForm({...scriptForm, type: template.id})}
                  >
                    <div style={{fontSize: '20px', marginBottom: '5px'}}>{template.name}</div>
                    <div style={{fontSize: '14px', color: '#666'}}>{template.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>น้ำเสียง</label>
                <select
                  style={styles.select}
                  value={scriptForm.tone}
                  onChange={(e) => setScriptForm({...scriptForm, tone: e.target.value})}
                >
                  {tones.map(tone => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>กลุ่มเป้าหมาย</label>
                <input
                  style={styles.input}
                  type="text"
                  value={scriptForm.targetAudience}
                  onChange={(e) => setScriptForm({...scriptForm, targetAudience: e.target.value})}
                  placeholder="เช่น วัยรุ่น, คนทำงาน, แม่บ้าน"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>ข้อมูลสินค้า/บริการ (ยิ่งละเอียดยิ่งดี)</label>
              <textarea
                style={styles.textarea}
                value={scriptForm.productInfo}
                onChange={(e) => setScriptForm({...scriptForm, productInfo: e.target.value})}
                placeholder="ตัวอย่าง: ครีมบำรุงผิวหน้า สำหรับผิวแพ้ง่าย ส่วนผสมจากธรรมชาติ 100% ช่วยลดริ้วรอย ราคา 590 บาท..."
                required
              />
            </div>

            <button
              style={{...styles.button, width: '100%', fontSize: '18px', padding: '15px'}}
              onClick={generateScript}
              disabled={loading || credits < 5}
            >
              {loading ? '⏳ กำลังสร้างสคริปต์...' : '✨ สร้างสคริปต์ (ใช้ 5 เครดิต)'}
            </button>

            {generatedScript && (
              <div style={{...styles.scriptCard, marginTop: '30px'}}>
                <h3>📋 สคริปต์ที่สร้างเสร็จแล้ว</h3>
                <div style={styles.scriptContent}>
                  {generatedScript.content}
                </div>
                <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                  <button
                    style={styles.button}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedScript.content);
                      setMessage('คัดลอกสคริปต์แล้ว!');
                    }}
                  >
                    📋 คัดลอก
                  </button>
                  <button
                    style={styles.outlineButton}
                    onClick={() => {
                      setTtsText(generatedScript.content);
                      setCurrentView('tts');
                    }}
                  >
                    🔊 แปลงเป็นเสียง
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TTS View */}
        {currentView === 'tts' && (
          <div style={styles.card}>
            <h2 style={styles.title}>🔊 แปลงข้อความเป็นเสียงพูด</h2>
            <p style={styles.subtitle}>ใส่ข้อความหรือสคริปต์ที่ต้องการแปลงเป็นเสียง</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>ข้อความที่ต้องการแปลงเป็นเสียง</label>
              <textarea
                style={styles.textarea}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="วางสคริปต์หรือข้อความที่นี่..."
                rows="10"
              />
            </div>

            <button
              style={{...styles.button, width: '100%', fontSize: '18px', padding: '15px'}}
              onClick={generateTTS}
              disabled={loading || credits < 10 || !ttsText}
            >
              {loading ? '⏳ กำลังสร้างเสียง...' : '🎤 แปลงเป็นเสียง (ใช้ 10 เครดิต)'}
            </button>

            <div style={{marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '10px'}}>
              <p style={{color: '#666'}}>
                💡 <strong>เคล็ดลับ:</strong> ระบบจะใช้เสียงภาษาไทยมาตรฐาน
                คุณสามารถปรับความเร็วและน้ำเสียงได้ในอนาคต
              </p>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div style={styles.card}>
            <h2 style={styles.title}>📚 ประวัติการใช้งาน</h2>
            <p style={styles.subtitle}>สคริปต์ทั้งหมดที่คุณสร้าง</p>

            {scripts.length === 0 ? (
              <p style={{textAlign: 'center', color: '#999', padding: '40px'}}>
                ยังไม่มีสคริปต์ที่สร้าง
              </p>
            ) : (
              scripts.map(script => (
                <div key={script.id} style={styles.scriptCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <strong>{script.productInfo.substring(0, 50)}...</strong>
                    <span style={{color: '#666', fontSize: '14px'}}>
                      {new Date(script.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div style={{...styles.scriptContent, maxHeight: '200px', overflow: 'auto'}}>
                    {script.content}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;