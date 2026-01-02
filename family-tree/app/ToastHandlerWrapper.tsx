'use client'

import { ReactNode, useEffect } from 'react';
import { useToast } from './ToastContext';

export default function ToastHandlerWrapper({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  useEffect(() => {
    const pending = localStorage.getItem("pending_toast");
    if (pending) {
      const { message, type } = JSON.parse(pending);
      showToast({message, type});
      localStorage.removeItem("pending_toast");
    }
  }, [showToast]);

  return <>{children}</>;
}
