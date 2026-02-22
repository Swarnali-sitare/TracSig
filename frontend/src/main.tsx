import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          colorBgContainer: 'transparent',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: '#e2e8f0',
        },
        components: {
          Input: {
            colorBgContainer: 'transparent',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
            activeBorderColor: '#6366f1',
            hoverBorderColor: 'rgba(255, 255, 255, 0.18)',
          },
          Select: {
            colorBgContainer: 'transparent',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
            colorText: '#e2e8f0',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
