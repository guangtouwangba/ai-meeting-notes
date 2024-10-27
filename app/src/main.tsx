import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';  // 添加这一行来导入 CSS

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
