import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icon = type === 'success' ? '✓' : '⚠️';

  return (
    <div
      className={`toast ${type}`}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      style={{ cursor: 'pointer' }}
    >
      <span aria-hidden="true">{icon}</span>
      {message}
    </div>
  );
}
