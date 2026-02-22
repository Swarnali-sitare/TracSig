import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Input, Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials } from '../types';
import styles from '../styles/Auth.module.css';

export function Login(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/home';

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const credentials: LoginCredentials = { email: email.trim(), password };
    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label}>
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Password
            <div className={styles.passwordWrap}>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={styles.input}
              />
            </div>
          </label>
          <Button type="primary" htmlType="submit" disabled={loading} loading={loading} className={styles.button}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
