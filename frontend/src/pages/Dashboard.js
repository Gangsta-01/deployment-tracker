import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import StatusBadge from '../components/StatusBadge';
import {
  MOCK_STATS, MOCK_HISTORY, MOCK_DEPLOYMENTS, MOCK_ENVIRONMENTS
} from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const ENV_ORDER = ['production', 'staging', 'development', 'testing'];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? MOCK_DEPLOYMENTS
    : MOCK_DEPLOYMENTS.filter(d => d.status === filter);

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">
            Good morning, {user?.name?.split(' ')[0]} — here's your deployment pulse.
          </p>
        </div>
        <div className="dash-header-actions">
          <div className="live-indicator">
            <span className="live-dot" />
            Live
          </div>
          <button className="btn-trigger">+ New Deployment</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Total Deployments" value={MOCK_STATS.totalDeployments} sub="all time" accent />
        <StatCard label="Success Rate"       value={`${MOCK_STATS.successRate}%`} sub="last 30 days" />
        <StatCard label="Avg Duration"       value={MOCK_STATS.avgDuration} sub="per pipeline" />
        <StatCard label="Today"              value={MOCK_STATS.deploymentsToday} sub={`${MOCK_STATS.failedToday} failed`} />
      </div>

      {/* Environments */}
      <div className="section">
        <h2 className="section-title">Environments</h2>
        <div className="env-grid">
          {MOCK_ENVIRONMENTS.map(env => (
            <div className="env-card" key={env.id}>
              <div className="env-header">
                <span className="env-dot" style={{ background: env.color }} />
                <span className="env-name">{env.name}</span>
                <span className="env-health" style={{ color: env.color }}>{env.health}%</span>
              </div>
              <div className="env-bar-track">
                <div
                  className="env-bar-fill"
                  style={{ width: `${env.health}%`, background: env.color }}
                />
              </div>
              <p className="env-services">{env.services} services</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="section">
        <h2 className="section-title">Deployment History — Last 7 Days</h2>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_HISTORY} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2d45" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4b5a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2}
                fill="url(#gradSuccess)" name="Success" dot={false} />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2}
                fill="url(#gradFailed)" name="Failed" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deployments Table */}
      <div className="section">
        <div className="section-row">
          <h2 className="section-title">Recent Deployments</h2>
          <div className="filter-tabs">
            {['all', 'running', 'success', 'failed', 'queued'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="depl-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Version</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Branch</th>
                <th>Commit</th>
                <th>Triggered By</th>
                <th>Started</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className={`depl-row ${d.status === 'running' ? 'row-running' : ''}`}>
                  <td>
                    <div className="service-cell">
                      <span className="service-name">{d.service}</span>
                      <span className="build-num">{d.buildNumber}</span>
                    </div>
                  </td>
                  <td><code className="mono">{d.version}</code></td>
                  <td>
                    <span className={`env-tag env-${d.environment}`}>{d.environment}</span>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td><code className="mono branch">{d.branch}</code></td>
                  <td><code className="mono commit">{d.commit}</code></td>
                  <td className="triggered-by">{d.triggeredBy}</td>
                  <td className="time-cell">{timeAgo(d.startedAt)}</td>
                  <td className="duration-cell">{d.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">No deployments match this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}
