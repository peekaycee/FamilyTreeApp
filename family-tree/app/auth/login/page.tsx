'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { setSession, getSession } from '@/utils/session';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const session = getSession();

  const pushToast = (message: string, type: 'success' | 'error' = 'error') => {
    const toast = document.createElement('div');
    toast.className = `${styles.toast} ${styles[type]}`;
    toast.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5500);
  };

    const handleRegisterClick = () => {
    const session = getSession();

    if (session) {
      pushToast(
        'Logged in already. Continue with credentials, contact us or subscribe to a plan get started.',
        'error'
      );
      return;
    }

    router.push('/plans');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email.trim() || !password.trim()) {
    pushToast('Please fill all required fields.', 'error');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      throw new Error(result?.message || 'Login failed');
    }

    const { session } = result;

    if (session) {
      setSession(session); // your central session storage
    }

    pushToast('Login successful.', 'success');

    // ✅ Use next/navigation router immediately
    router.push('/basic/homePage');

  } catch (err: any) {
    pushToast(err.message || 'Login failed. Please check your credentials.', 'error');
    setLoading(false);
  }
};

  return (
    <section className={styles.authPage}>
      <h2>Login</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
      </form>
        {/* <p>           
          Don&apos;t have an account? <a href="/auth/register">Register</a>
        </p> */}
        <p>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleRegisterClick}
          >
            Register
          </button>

          {session && (
            <>
              {" | "}
              <a href="/plans" className={styles.linkButton}>
                View Plans
              </a>
            </>
          )}
        </p>
    </section>
  );
}
