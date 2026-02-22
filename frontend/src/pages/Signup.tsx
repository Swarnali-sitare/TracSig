import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Select, Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { SignupCredentials, UserRole } from '../types';
import styles from '../styles/Auth.module.css';

const ROLES: UserRole[] = ['Teacher', 'Student', 'Admin'];

export function Signup(): React.ReactElement {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function validate(): string | null {
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    const credentials: SignupCredentials = {
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      role,
    };
    try {
      await signup(credentials);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign up</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label}>
            Name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={styles.input}
            />
          </label>
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
                minLength={6}
                autoComplete="new-password"
                className={styles.input}
              />
            </div>
          </label>
          <label className={styles.label}>
            Confirm password
            <div className={styles.passwordWrap}>
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={styles.input}
              />
            </div>
          </label>
          <label className={styles.label}>
            Role
            <div className={styles.selectWrap}>
              <Select
                value={role}
                onChange={(v) => setRole(v)}
                className={styles.select}
                options={ROLES.map((r) => ({ value: r, label: r }))}
                placeholder="Select role"
                getPopupContainer={() => document.body}
              />
            </div>
          </label>
          <Button type="primary" htmlType="submit" disabled={loading} loading={loading} className={styles.button}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
