'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../auth.module.css';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const pushToast = (message: string, type: 'success' | 'error' = 'error') => {
    const toast = document.createElement('div');
    toast.className = `${styles.toast} ${styles[type]}`;
    toast.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return pushToast('Fill all fields');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(result?.message || 'Registration failed');

      pushToast('Account created successfully', 'success');
      router.push('/auth/login');

    } catch (err: any) {
      pushToast(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <h2>Create Account</h2>
      <form className={styles.form} onSubmit={handleRegister}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register'}</button>
      </form>
      <p>
        Already have an account? <a href="/auth/login"><em>Login</em></a>
      </p>
    </section>
  );
}
