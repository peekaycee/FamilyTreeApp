// @ts-ignore
import './globals.css';
import styles from './page.module.css'
import Navbar from '../components/Navbar';
import { ReactNode } from 'react';
import PageTransition from './PageTransition';
import Footer from '../components/Footer';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={styles.body}>
        <Navbar />
        <PageTransition>
          <main>
            {children}
          </main> 
        </PageTransition>
        <Footer />
      </body>
    </html>
  )
}
