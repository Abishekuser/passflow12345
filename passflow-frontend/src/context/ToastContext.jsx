import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((msg, dur) => showToast(msg, 'success', dur), [showToast]);
  const showError = useCallback((msg, dur) => showToast(msg, 'error', dur || 5000), [showToast]);
  const showInfo = useCallback((msg, dur) => showToast(msg, 'info', dur), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          let Icon = Info;
          let toastClass = 'toast-info';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            toastClass = 'toast-success';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            toastClass = 'toast-error';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            toastClass = 'toast-warning';
          }

          return (
            <div key={toast.id} className={`toast ${toastClass}`}>
              <Icon size={20} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
