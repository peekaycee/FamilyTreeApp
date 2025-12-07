'use client';

import { ReactNode } from 'react';
import useAuthGuard from './hooks/useAuthGuard';

export default function ClientProtectedWrapper({ children }: { children: ReactNode }) {
  useAuthGuard(); // client-side guard runs here
  return <>{children}</>;
}
