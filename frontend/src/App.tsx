import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRefreshToken } from './hooks/useRefreshToken';
import { AppRoutes } from './routes';
import styles from './styles/App.module.css';

function AppInner(): React.ReactElement {
  const { accessToken } = useAuth();
  const { attemptRestore } = useRefreshToken();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (accessToken) {
      setInitialized(true);
      return;
    }
    attemptRestore().finally(() => setInitialized(true));
  }, [accessToken, attemptRestore]);

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  return <AppRoutes />;
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
