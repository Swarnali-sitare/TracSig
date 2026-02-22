import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Unauthorized.module.css';

export function Unauthorized(): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>401 Unauthorized</h1>
        <p className={styles.message}>You do not have access to this resource.</p>
        <Link to="/login" className={styles.link}>
          Go to Login
        </Link>
      </div>
    </div>
  );
}
