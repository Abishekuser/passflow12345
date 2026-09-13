import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...', size = 24, fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '2rem' }}>
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--primary)' }} />
      {text && <p className="text-secondary text-sm font-semibold">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '60vh', width: '100%' }}
      >
        {content}
      </div>
    );
  }

  return content;
}
