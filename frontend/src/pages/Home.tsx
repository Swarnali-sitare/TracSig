import React, { useState } from 'react';
import { Button } from 'antd';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Home.module.css';

export function Home(): React.ReactElement {
  const { user, role, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Assignment Tracker</h1>
        <Button
          type="default"
          onClick={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
          className={styles.logoutButton}
        >
          {loggingOut ? 'Logging out…' : 'Logout'}
        </Button>
      </header>
      <main className={styles.main}>
        <p className={styles.greeting}>
          Hello, <strong>{user?.name ?? 'User'}</strong>.
        </p>
        <p className={styles.role}>
          Role: <strong>{role ?? '—'}</strong>
        </p>
      </main>
    </div>
  );
}
