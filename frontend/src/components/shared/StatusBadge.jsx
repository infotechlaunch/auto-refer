import { getStatusBadge } from '../../lib/utils';

export default function StatusBadge({ status }) {
  const className = getStatusBadge(status);
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`badge ${className}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'currentColor',
        display: 'inline-block',
      }} />
      {label}
    </span>
  );
}
