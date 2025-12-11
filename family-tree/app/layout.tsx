// @ts-ignore
import './globals.css';
import styles from './page.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// import ClientProtectedWrapper from './ClientProtectedWrapper';
import { ReactNode } from 'react';
import PageTransition from './PageTransition';

export const metadata = {};
export const viewport = { width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={styles.body}>
        <Navbar />

        {/* Client-side wrapper only around main content */}
        {/* <ClientProtectedWrapper> */}
          <PageTransition>
            <main>{children}</main>
          </PageTransition>
        {/* </ClientProtectedWrapper> */}

        <Footer />
      </body>
    </html>
  )
}
