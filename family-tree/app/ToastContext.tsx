'use client'
import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error';
type Toast = { message: string; type?: ToastType };

interface ToastContextType {
  showToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== toast));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
        {toasts.map((t, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              padding: '12px 16px',
              backgroundColor: t.type === 'error' ? '#f56565' : '#48bb78',
              color: 'white',
              borderRadius: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <p>{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
