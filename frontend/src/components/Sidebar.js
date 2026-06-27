import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '⊞' },
  { id: 'deployments',  label: 'Deployments',  icon: '🚀' },
  { id: 'environments', label: 'Environments', icon: '◈' },
  { id: 'services',     label: 'Services',     icon: '⬡' },
  { id: 'pipelines',    label: 'Pipelines',    icon: '⋯' },
  { id: 'logs',         label: 'Logs',         icon: '≡' },
];

export default function Sidebar({ active, onNav }) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">⬡</span>
        <span className="sidebar-brand-name">DeployPulse</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'deployments' && (
              <span className="nav-badge">12</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{user?.avatar || user?.name?.slice(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout} title="Sign out">⏻</button>
      </div>
    </aside>
  );
}
