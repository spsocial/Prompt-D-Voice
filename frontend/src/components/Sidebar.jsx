import { NavLink } from 'react-router-dom';

function Sidebar({ user, onLogout }) {
  const navItems = [
    { path: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
    { path: '/script-generator', label: 'สร้างสคริปต์', icon: '✍️' },
    { path: '/text-to-speech', label: 'แปลงเป็นเสียง', icon: '🎙️' },
    { path: '/settings', label: 'ตั้งค่า', icon: '⚙️' }
  ];

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'pro': return '#4caf50';
      case 'enterprise': return '#ff9800';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>PromptD Voice</h1>
        <div className="user-info">
          <div>{user.name}</div>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>{user.email}</div>
          <span className="plan-badge" style={{ 
            background: getPlanColor(user.plan),
            color: 'white'
          }}>
            {user.plan}
          </span>
        </div>
      </div>

      <nav>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button onClick={onLogout} className="logout-btn">
        ออกจากระบบ
      </button>
    </div>
  );
}

export default Sidebar;