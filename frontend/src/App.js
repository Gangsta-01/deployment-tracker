import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import './styles/layout.css';
import api from "./services/api";
// ── Placeholder pages for future nav items ───────────────────
const Placeholder = ({ title }) => (
  <div style={{
    padding: '32px 36px',
    animation: 'fadeIn 0.3s ease'
  }}>
    <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
      {title}
    </h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
      This section connects to your Node.js backend. Coming soon.
    </p>
  </div>
);

// ── Layout wrapper ───────────────────────────────────────────
function AppLayout() {
  const [active, setActive] = React.useState('dashboard');

  const renderPage = () => {
    switch (active) {
      case 'dashboard':    return <Dashboard />;
      case 'deployments':  return <Placeholder title="Deployments" />;
      case 'environments': return <Placeholder title="Environments" />;
      case 'services':     return <Placeholder title="Services" />;
      case 'pipelines':    return <Placeholder title="Pipelines (Jenkins)" />;
      case 'logs':         return <Placeholder title="Logs" />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar active={active} onNav={setActive} />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

// ── Protected route ──────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// ── Root ─────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
