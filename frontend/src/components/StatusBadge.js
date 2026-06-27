import React from 'react';
import './StatusBadge.css';

const STATUS_MAP = {
  success:  { label: 'Success',  color: 'success', dot: true },
  running:  { label: 'Running',  color: 'accent',  dot: true, pulse: true },
  failed:   { label: 'Failed',   color: 'danger',  dot: true },
  queued:   { label: 'Queued',   color: 'warning', dot: true },
  pending:  { label: 'Pending',  color: 'neutral', dot: true },
  cancelled:{ label: 'Cancelled',color: 'neutral', dot: true },
};

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'neutral', dot: true };

  return (
    <span className={`status-badge status-${cfg.color} size-${size}`}>
      {cfg.dot && (
        <span className={`status-dot ${cfg.pulse ? 'pulse' : ''}`} />
      )}
      {cfg.label}
    </span>
  );
}
