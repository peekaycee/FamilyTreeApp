// @ts-ignore
import './globals.css';
import styles from './page.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ClientProtectedWrapper from './ClientProtectedWrapper';
import { ReactNode } from 'react';
import PageTransition from './PageTransition';
import { ToastProvider } from './ToastContext';
import ToastHandlerWrapper from './ToastHandlerWrapper';
import { SettingsProvider } from "@/app/contexts/SettingsContext";
import ThemeProvider from "@/app/providers/ThemeProvider";

export const metadata = {};
export const viewport = { width: 'device-width', initialScale: 1 };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme='light'>
      <body className={styles.body} suppressHydrationWarning>
        <SettingsProvider>
          <ThemeProvider>
            <ToastProvider>
              <ToastHandlerWrapper>
                <Navbar />
                <ClientProtectedWrapper>
                  <PageTransition>
                    <main>{children}</main>
                  </PageTransition>
                </ClientProtectedWrapper>
              </ToastHandlerWrapper>
            </ToastProvider>
            <Footer />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
